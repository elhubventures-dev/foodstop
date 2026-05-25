import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { 
  sendEmail, 
  generateOrderConfirmationTemplate, 
  generateAdminNotificationTemplate 
} from '@/lib/email';

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Webhook verification is not configured' }, { status: 401 });
    }
    
    // Verify Paystack signature
    const hash = crypto.createHmac('sha512', secret)
                       .update(payload)
                       .digest('hex');
                       
    if (!timingSafeEqualHex(hash, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const amountPaidKobo = Number(event.data.amount);
      const channel = event.data.channel;

      const { data: existingOrder, error: existingError } = await supabaseAdmin
        .from('orders')
        .select('id, total, status')
        .eq('paystack_reference', reference)
        .maybeSingle();

      if (existingError) {
        console.error('Failed to fetch order for webhook:', existingError);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
      }

      if (!existingOrder) {
        console.warn(`Paystack webhook received before order exists: ${reference}`);
        return NextResponse.json({ received: true, pendingOrder: true });
      }

      const expectedAmountKobo = Math.round(Number(existingOrder.total) * 100);
      if (amountPaidKobo !== expectedAmountKobo) {
        console.error(
          `Paystack amount mismatch for ${reference}: paid=${amountPaidKobo} expected=${expectedAmountKobo}`,
        );
        return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
      }

      const wasAlreadyConfirmed = existingOrder.status === 'confirmed';

      // Update order status in Supabase
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'confirmed', 
          paid_at: new Date().toISOString(),
          payment_channel: channel 
        })
        .eq('id', existingOrder.id)
        .select()
        .single();
        
      if (error) {
        console.error('Failed to update order status:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
      }
      
      // 3. Fetch full order details for the email (with items and profile)
      const { data: fullOrder } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          profiles:user_id (full_name, email),
          order_items (*)
        `)
        .eq('id', order.id)
        .single();

      if (fullOrder && !wasAlreadyConfirmed) {
        const customerEmail = fullOrder.delivery_address?.email || fullOrder.profiles?.email;
        
        // Send Confirmation to Customer
        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            subject: `Order Confirmed - #${fullOrder.id.slice(0, 8).toUpperCase()}`,
            html: generateOrderConfirmationTemplate(fullOrder)
          });
        }

        // Send Alert to Admin
        await sendEmail({
          to: process.env.SMTP_FROM_EMAIL, // Or a dedicated ADMIN_EMAIL env var
          subject: `New Order Received - ₦${Number(fullOrder.total).toLocaleString()}`,
          html: generateAdminNotificationTemplate(fullOrder)
        });
      }
      
      return NextResponse.json({ received: true });
    }
    
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
