import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail, generateOrderConfirmationTemplate } from '@/lib/email';
import { scanNewOrderForFraud } from '@/lib/orderFraudScan';

const DEFAULT_MERCHANT =
  process.env.NEXT_PUBLIC_ANCHOR_MERCHANT_ID ?? '00000000-0000-0000-0000-000000000001';

const isUUID = (str) => {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return str && regexExp.test(str);
};

function defaultDeliveryFee(subtotal) {
  return subtotal >= 20000 ? 0 : 1500;
}

const MONEY_TOLERANCE = 0.05;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      items,
      address,
      phoneNumber,
      email,
      userId,
      paystackReference,
      promoCode: promoCodeRaw,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const reference =
      paystackReference || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const ids = [...new Set(items.map((i) => i.id).filter(isUUID))];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid menu item ids' }, { status: 400 });
    }

    const { data: dbItems, error: dbErr } = await supabaseAdmin
      .from('menu_items')
      .select('id, price, merchant_id, name')
      .in('id', ids);

    if (dbErr) throw dbErr;
    const byId = Object.fromEntries((dbItems || []).map((r) => [r.id, r]));

    let serverSubtotal = 0;
    const merchantIds = new Set();
    for (const line of items) {
      const row = byId[line.id];
      if (!row) {
        return NextResponse.json({ error: `Unknown menu item: ${line.id}` }, { status: 400 });
      }
      const qty = Number(line.quantity) || 0;
      if (qty <= 0) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      }
      const unit = Number(row.price);
      serverSubtotal += unit * qty;
      if (row.merchant_id) merchantIds.add(row.merchant_id);
    }

    if (merchantIds.size > 1) {
      return NextResponse.json({ error: 'Cart mixes multiple restaurants' }, { status: 400 });
    }

    const merchantId =
      merchantIds.size === 1 ? [...merchantIds][0] : items[0]?.merchant_id || DEFAULT_MERCHANT;

    const baseDelivery = defaultDeliveryFee(serverSubtotal);
    const promoCode =
      typeof promoCodeRaw === 'string' && promoCodeRaw.trim() ? promoCodeRaw.trim() : '';

    let delivery_fee = baseDelivery;
    let discount = 0;
    let total = serverSubtotal + delivery_fee;
    let applied_promotion_id = null;
    let coupon_code = null;

    if (promoCode) {
      const { data: promoResult, error: prErr } = await supabaseAdmin.rpc('validate_merchant_promo', {
        p_merchant_id: merchantId,
        p_code: promoCode,
        p_subtotal: serverSubtotal,
        p_delivery_fee: baseDelivery,
      });
      if (prErr) throw prErr;
      const pr = promoResult;
      if (!pr || pr.valid !== true) {
        return NextResponse.json(
          { error: pr?.reason === 'min_order' ? 'Order subtotal is below this code minimum.' : 'Invalid promo code.' },
          { status: 400 },
        );
      }
      discount = Number(pr.discount ?? 0);
      delivery_fee = Number(pr.delivery_fee ?? baseDelivery);
      total = Number(pr.total ?? serverSubtotal + delivery_fee);
      applied_promotion_id = pr.promotion_id;
      coupon_code = String(pr.code || promoCode).toUpperCase();
    } else {
      if (Math.abs(Number(body.subtotal) - serverSubtotal) > MONEY_TOLERANCE) {
        return NextResponse.json({ error: 'Subtotal mismatch — refresh your cart.' }, { status: 400 });
      }
      if (Math.abs(Number(body.deliveryFee) - baseDelivery) > MONEY_TOLERANCE) {
        return NextResponse.json({ error: 'Delivery fee mismatch — refresh your cart.' }, { status: 400 });
      }
      if (Math.abs(Number(body.total) - total) > MONEY_TOLERANCE) {
        return NextResponse.json({ error: 'Total mismatch — refresh your cart.' }, { status: 400 });
      }
    }

    const tax = 0;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        status: 'pending',
        type: 'delivery',
        merchant_id: merchantId,
        subtotal: serverSubtotal,
        delivery_fee,
        tax,
        discount,
        total,
        coupon_code,
        applied_promotion_id,
        delivery_address: { address, phone: phoneNumber, email },
        paystack_reference: reference,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => {
      const row = byId[item.id];
      return {
        order_id: order.id,
        menu_item_id: item.id,
        merchant_id: row?.merchant_id ?? merchantId,
        name: item.name || row?.name || 'Item',
        price: Number(row?.price ?? item.price),
        quantity: Number(item.quantity) || 1,
        modifiers: item.modifiers || {},
        subtotal: (Number(row?.price ?? item.price) || 0) * (Number(item.quantity) || 1),
      };
    });

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);

    if (itemsError) throw itemsError;

    void scanNewOrderForFraud(supabaseAdmin, {
      orderId: order.id,
      userId: userId || null,
      merchantId,
      total,
    });

    if (email) {
      const fullOrder = {
        id: order.id,
        items,
        order_items: orderItems,
        subtotal: serverSubtotal,
        delivery_fee,
        tax,
        discount,
        total_amount: total,
        delivery_address: { address, phone: phoneNumber, email },
        profiles: { full_name: items[0]?.fullName || 'Customer' },
      };

      await sendEmail({
        to: email,
        subject: `Order Received - #${order.id.slice(0, 8).toUpperCase()}`,
        html: generateOrderConfirmationTemplate(fullOrder),
      });
    }

    return NextResponse.json({ reference, orderId: order.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
