// Test script to verify the email templates and send logic
// Run with: node /tmp/test-email.mjs

import { generateOrderConfirmationTemplate, generateAdminNotificationTemplate } from './food-stop-app/lib/email.js';

const mockOrder = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  subtotal: 5000,
  delivery_fee: 1500,
  total_amount: 6500,
  delivery_address: {
    address: '12 Test Street, Abuja',
    phone: '+2348011223344',
    email: 'tester@example.com'
  },
  profiles: {
    full_name: 'Test Customer'
  },
  order_items: [
    { name: 'Jollof Express', quantity: 2, price: 2000, subtotal: 4000 },
    { name: 'Cold Zobo', quantity: 1, price: 1000, subtotal: 1000 }
  ]
};

console.log('--- TESTING ORDER CONFIRMATION TEMPLATE ---');
const customerHtml = generateOrderConfirmationTemplate(mockOrder);
if (customerHtml.includes('Jollof Express') && customerHtml.includes('₦6,500')) {
  console.log('✅ Customer template rendered correctly with items and total.');
} else {
  console.log('❌ Customer template missing critical data.');
}

console.log('\n--- TESTING ADMIN NOTIFICATION TEMPLATE ---');
const adminHtml = generateAdminNotificationTemplate(mockOrder);
if (adminHtml.includes('New Order Received! 🍕') && adminHtml.includes('Test Customer')) {
  console.log('✅ Admin template rendered correctly.');
} else {
  console.log('❌ Admin template missing critical data.');
}

console.log('\n--- VERIFICATION COMPLETE ---');
