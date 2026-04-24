# Phase 5 — Payments & Order Processing

## Paystack Integration

Paystack is Africa's leading payment gateway. It supports cards, bank transfers, USSD, mobile money, and more.

### Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx
```

### Server-side Setup (`lib/paystack.js`)
```js
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function paystackRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, options);
  const data = await res.json();

  if (!data.status) throw new Error(data.message || 'Paystack request failed');
  return data;
}

export async function initializeTransaction({ email, amount, reference, metadata, callbackUrl }) {
  return paystackRequest('/transaction/initialize', 'POST', {
    email,
    amount, // Amount in kobo (NGN) or pesewas (GHS) — smallest currency unit
    reference,
    metadata,
    callback_url: callbackUrl,
  });
}

export async function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${reference}`);
}
```

### Client-side Paystack Popup

Install the React Paystack library:
```bash
npm install react-paystack
```

Or use the Paystack inline script directly:
```js
// In checkout component
const payWithPaystack = () => {
  const handler = PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email: user.email,
    amount: Math.round(totals.total * 100), // Convert to kobo/pesewas
    currency: 'NGN', // or 'GHS', 'USD', 'ZAR', 'KES'
    ref: `order_${orderId}_${Date.now()}`,
    metadata: {
      order_id: orderId,
      user_id: user.id,
      custom_fields: [
        { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
      ],
    },
    onClose: () => {
      toast.error('Payment cancelled');
    },
    callback: (response) => {
      // response.reference — verify this on the server
      verifyPayment(response.reference);
    },
  });
  handler.openIframe();
};
```

## Initialize Transaction API Route (`app/api/paystack/initialize/route.js`)

Server-side transaction initialization (alternative to client-side popup):

```js
import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/paystack';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, deliveryAddress, orderType, couponCode, totals } = await request.json();

    // Validate items against database prices (prevent price tampering)
    const menuItemIds = items.map(i => i.menuItemId);
    const { data: dbItems } = await supabase
      .from('menu_items')
      .select('id, name, price')
      .in('id', menuItemIds);

    // Verify totals match server-side calculation
    // ... price validation logic ...

    // Create the order in database first (status: pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        type: orderType,
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        coupon_code: couponCode,
        delivery_address: deliveryAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers,
      special_instructions: item.specialInstructions,
      subtotal: item.itemTotal,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Generate unique reference
    const reference = `ORD-${order.order_number}-${Date.now()}`;

    // Initialize Paystack transaction
    const paystackResponse = await initializeTransaction({
      email: user.email,
      amount: Math.round(totals.total * 100), // Kobo/pesewas
      reference,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        order_number: order.order_number,
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?reference=${reference}&order_id=${order.id}`,
    });

    // Update order with Paystack reference
    await supabase
      .from('orders')
      .update({ paystack_reference: reference })
      .eq('id', order.id);

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
```

## Paystack Webhook Handler (`app/api/paystack/webhook/route.js`)

Handle payment events from Paystack:

```js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get('x-paystack-signature');

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    console.error('Invalid Paystack webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case 'charge.success': {
      const { reference, metadata, amount, currency, paid_at, channel } = event.data;
      const orderId = metadata.order_id;

      // Update order status to confirmed
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'confirmed',
          paystack_reference: reference,
          payment_channel: channel, // card, bank, ussd, mobile_money, etc.
          paid_at: paid_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Update coupon usage count if applicable
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('coupon_code')
        .eq('id', orderId)
        .single();

      if (order?.coupon_code) {
        await supabaseAdmin.rpc('increment_coupon_usage', { coupon_code: order.coupon_code });
      }

      // Send confirmation email
      await sendOrderConfirmationEmail(orderId);
      break;
    }

    case 'charge.failed': {
      const { reference, metadata } = event.data;
      const orderId = metadata.order_id;

      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      break;
    }

    case 'transfer.success': {
      // Handle refund confirmations if using Paystack Transfers for refunds
      break;
    }

    default:
      console.log(`Unhandled Paystack event: ${event.event}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
```

## Database Updates for Paystack

Update the orders table to use Paystack-specific fields:

```sql
-- Replace Stripe columns with Paystack columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_channel TEXT; -- card, bank, ussd, mobile_money
ALTER TABLE orders DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE orders DROP COLUMN IF EXISTS stripe_session_id;

-- Helper function for coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
  UPDATE coupons SET used_count = used_count + 1 WHERE code = coupon_code;
$$ LANGUAGE sql;
```

## Checkout Flow with Paystack

### Option A: Redirect Flow (recommended for full-page checkout)
1. User clicks "Pay Now"
2. Frontend calls `/api/paystack/initialize`
3. API returns `authorization_url`
4. Redirect user to Paystack checkout page
5. After payment, Paystack redirects to `callback_url`
6. Success page verifies payment via `/api/paystack/verify`

### Option B: Popup Flow (inline payment)
1. User clicks "Pay Now"
2. Paystack Popup opens in an iframe overlay
3. User completes payment within popup
4. `callback` function fires with `reference`
5. Frontend calls verify endpoint

### Verification on Success Page (`app/checkout/success/page.js`)

```js
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        if (data.status === 'success') {
          setOrder(data.order);
          // Clear the cart
          clearCart();
        }
      } catch (err) {
        console.error('Verification failed:', err);
      } finally {
        setVerifying(false);
      }
    };

    if (reference) verify();
  }, [reference]);

  // ... render success UI
}
```

### Verify API Route (`app/api/paystack/verify/route.js`)
```js
import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/paystack';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  try {
    const result = await verifyTransaction(reference);

    if (result.data.status === 'success') {
      const supabase = await createClient();
      const orderId = result.data.metadata.order_id;

      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      return NextResponse.json({ status: 'success', order });
    }

    return NextResponse.json({ status: 'failed', message: 'Payment not confirmed' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
```

## Order Confirmation Page (`app/checkout/success/page.js`)

Shown after successful payment verification:

- Success animation (checkmark with green circle)
- Order number display (large, prominent)
- Payment method used (card ending ****, bank transfer, etc.)
- Order summary: items, totals, delivery address
- Estimated delivery/pickup time
- "Track Order" button → order detail page
- "Continue Shopping" link
- Clear the cart after successful display

### Success Animation CSS
```css
.success-checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-6);
  animation: scaleIn var(--transition-bounce);
}

.success-checkmark svg {
  width: 40px;
  height: 40px;
  color: white;
  animation: fadeIn 0.3s 0.3s both;
}
```

## Order Status Updates

### Status Flow
```
pending → confirmed → preparing → ready → out_for_delivery → delivered
                                        → picked_up (for pickup orders)
pending → cancelled
confirmed → refunded
```

### Real-time Updates with Supabase Realtime

Subscribe to order changes on the client:
```js
useEffect(() => {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
      filter: `id=eq.${orderId}`,
    }, (payload) => {
      setOrder(payload.new);
      toast.success(`Order status: ${formatStatus(payload.new.status)}`);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [orderId]);
```

## Supported Payment Channels

Paystack supports multiple channels out of the box. The user doesn't need extra config — Paystack shows available options based on the customer's country:

| Channel | Countries | Description |
|---------|-----------|-------------|
| Card | All | Visa, Mastercard, Verve |
| Bank Transfer | Nigeria, South Africa | Generate account number for transfer |
| USSD | Nigeria | Pay via USSD code (*737#, etc.) |
| Mobile Money | Ghana, Kenya | MTN, Vodafone, Airtel Money |
| QR Code | Nigeria | Scan to pay |
| Apple Pay | International | Apple Pay on supported devices |

## Order Confirmation Email

Using Resend or Nodemailer, send an HTML email:

```js
async function sendOrderConfirmationEmail(orderId) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);

  await sendEmail({
    to: user.email,
    subject: `Order Confirmed — #${order.order_number}`,
    html: generateOrderEmailHTML(order),
  });
}
```

The email should include:
- Restaurant logo and branding
- Order number and date
- Payment method and channel
- Itemized list with prices
- Order totals (subtotal, delivery, tax, discount, total)
- Delivery address or pickup instructions
- Estimated time
- Support contact information
