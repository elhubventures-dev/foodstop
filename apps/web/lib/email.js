import nodemailer from 'nodemailer';

/**
 * Configure the SMTP transport
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email using the configured SMTP transport
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'FOOD STOP'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text: text || "This email requires HTML to view properly.",
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Order Confirmation HTML Template
 */
export function generateOrderConfirmationTemplate(order) {
  const itemsHtml = order.order_items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">${item.name}</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">${item.quantity} x ₦${Number(item.price).toLocaleString()}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; vertical-align: bottom;">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">₦${Number(item.subtotal).toLocaleString()}</p>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - FOOD STOP</title>
    </head>
    <body style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #1e293b; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">FOOD STOP</h1>
          <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Thank you for your order!</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 18px; font-weight: 700;">Order #${order.id.slice(0, 8).toUpperCase()}</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hi ${order.profiles?.full_name || 'there'}, your order has been successfully placed and is being processed. 
            We'll let you know as soon as it's ready for delivery!
          </p>

          <!-- Order Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr>
                <th style="text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9;">Item</th>
                <th style="text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 24px; color: #64748b; font-size: 14px;">Subtotal</td>
                <td style="padding-top: 24px; text-align: right; color: #1e293b; font-weight: 600;">₦${Number(order.subtotal).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding-top: 8px; color: #64748b; font-size: 14px;">Delivery Fee</td>
                <td style="padding-top: 8px; text-align: right; color: #1e293b; font-weight: 600;">₦${Number(order.delivery_fee).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding-top: 16px; border-top: 2px solid #f1f5f9; font-size: 18px; font-weight: 800; color: #1e293b;">Total</td>
                <td style="padding-top: 16px; border-top: 2px solid #f1f5f9; text-align: right; font-size: 18px; font-weight: 800; color: #ef4444;">₦${Number(order.total).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Delivery Address -->
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Delivery Details</h3>
            <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5;">
              ${order.delivery_address?.address || 'N/A'}<br>
              Phone: ${order.delivery_address?.phone || 'N/A'}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            &copy; ${new Date().getFullYear()} FOOD STOP. All rights reserved.<br>
            If you have any questions, contact us at ${process.env.SMTP_FROM_EMAIL}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Admin Notification HTML Template
 */
export function generateAdminNotificationTemplate(order) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert - FOOD STOP</title>
    </head>
    <body style="font-family: sans-serif; background-color: #fff7ed; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 2px solid #fb923c; border-radius: 16px; padding: 32px;">
        <h1 style="color: #ea580c; margin: 0 0 16px; font-size: 24px;">New Order Received! 🍕</h1>
        <p style="font-size: 16px; color: #431407; margin-bottom: 24px;">
          A new order <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> has been placed and confirmed via payment.
        </p>
        
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #9a3412; font-size: 14px;">
            <strong>Customer:</strong> ${order.profiles?.full_name || 'Guest'}<br>
            <strong>Total:</strong> ₦${Number(order.total).toLocaleString()}<br>
            <strong>Payment:</strong> ${order.payment_channel || 'Confirmed'}
          </p>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
          Manage Order in Admin Dashboard
        </a>
      </div>
    </body>
    </html>
  `;
}
