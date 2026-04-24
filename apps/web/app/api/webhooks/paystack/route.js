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
    
    // Verify Paystack signature
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                       .update(payload)
                       .digest('hex');
                       
    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const amountPaid = event.data.amount / 100; // Convert from kobo to NGN
      const channel = event.data.channel;
      
      // Update order status in Supabase
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          status: 'confirmed', 
          paid_at: new Date().toISOString(),
          payment_channel: channel 
        })
        .eq('paystack_reference', reference)
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
          profiles:user_id (full_name),
          order_items (*)
        `)
        .eq('id', order.id)
        .single();

      if (fullOrder) {
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
          subject: `New Order Received - ₦${Number(fullOrder.total_amount).toLocaleString()}`,
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
