import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail, generateOrderConfirmationTemplate } from '@/lib/email';

const isUUID = (str) => {
  const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return str && regexExp.test(str);
};

export async function POST(request) {
  try {
    const { items, subtotal, deliveryFee, tax, discount, total, address, phoneNumber, email, userId, paystackReference } = await request.json();

    // 1. Use the reference from Paystack if provided, otherwise fallback
    const reference = paystackReference || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Insert order into database with 'pending' status
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null, // null if guest
        status: 'pending',
        type: 'delivery',
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        discount,
        total,
        delivery_address: { address, phone: phoneNumber, email },
        paystack_reference: reference,
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // 3. Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: isUUID(item.id) ? item.id : null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      modifiers: item.modifiers || {},
      subtotal: item.subtotal
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 4. Send acknowledgment email to customer if email is provided
    if (email) {
      // Create a mock order object for the template
      const fullOrder = {
        id: order.id,
        items,
        order_items: orderItems,
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        discount,
        total_amount: total,
        delivery_address: { address, phone: phoneNumber, email },
        profiles: { full_name: items[0]?.fullName || 'Customer' } // Fallback for name
      };

      await sendEmail({
        to: email,
        subject: `Order Received - #${order.id.slice(0, 8).toUpperCase()}`,
        html: generateOrderConfirmationTemplate(fullOrder)
      });
    }

    return NextResponse.json({ reference, orderId: order.id });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
