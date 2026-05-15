# assets/nigerian-banks.json
# Full CBN-licensed bank list with Paystack bank codes

[
  { "name": "Access Bank", "code": "044", "type": "commercial" },
  { "name": "Citibank Nigeria", "code": "023", "type": "commercial" },
  { "name": "Ecobank Nigeria", "code": "050", "type": "commercial" },
  { "name": "Fidelity Bank", "code": "070", "type": "commercial" },
  { "name": "First Bank of Nigeria", "code": "011", "type": "commercial" },
  { "name": "First City Monument Bank (FCMB)", "code": "214", "type": "commercial" },
  { "name": "Globus Bank", "code": "00103", "type": "commercial" },
  { "name": "Guaranty Trust Bank (GTBank)", "code": "058", "type": "commercial" },
  { "name": "Heritage Bank", "code": "030", "type": "commercial" },
  { "name": "Jaiz Bank", "code": "301", "type": "microfinance" },
  { "name": "Keystone Bank", "code": "082", "type": "commercial" },
  { "name": "Lotus Bank", "code": "303", "type": "commercial" },
  { "name": "Parallex Bank", "code": "526", "type": "microfinance" },
  { "name": "Polaris Bank", "code": "076", "type": "commercial" },
  { "name": "Premium Trust Bank", "code": "105", "type": "commercial" },
  { "name": "Providus Bank", "code": "101", "type": "commercial" },
  { "name": "Stanbic IBTC Bank", "code": "221", "type": "commercial" },
  { "name": "Standard Chartered Bank", "code": "068", "type": "commercial" },
  { "name": "Sterling Bank", "code": "232", "type": "commercial" },
  { "name": "SunTrust Bank", "code": "100", "type": "commercial" },
  { "name": "Titan Trust Bank", "code": "102", "type": "commercial" },
  { "name": "Union Bank of Nigeria", "code": "032", "type": "commercial" },
  { "name": "United Bank for Africa (UBA)", "code": "033", "type": "commercial" },
  { "name": "Unity Bank", "code": "215", "type": "commercial" },
  { "name": "Wema Bank", "code": "035", "type": "commercial" },
  { "name": "Zenith Bank", "code": "057", "type": "commercial" },
  { "name": "Kuda Bank", "code": "090267", "type": "microfinance" },
  { "name": "Opay (OPay Digital Services)", "code": "999992", "type": "fintech" },
  { "name": "Palmpay", "code": "999991", "type": "fintech" },
  { "name": "Moniepoint Microfinance Bank", "code": "090405", "type": "microfinance" },
  { "name": "Carbon (OneFi)", "code": "565", "type": "fintech" },
  { "name": "Piggyvest (Piggybank)", "code": "034", "type": "fintech" },
  { "name": "VFD Microfinance Bank", "code": "090110", "type": "microfinance" },
  { "name": "Rubies Microfinance Bank", "code": "125", "type": "microfinance" }
]

---

# assets/email-templates.md
# All merchant notification email templates (SendGrid dynamic templates)

## Template: merchant_application_received
Subject: "We've Received Your ChopFast Merchant Application 🎉"
Body:
  Hi {{owner_name}},
  Thank you for applying to join ChopFast as a merchant partner!
  Your application reference is: {{application_ref}}
  What happens next:
  1. Our team will review your documents within 24-48 hours
  2. You'll receive an email and SMS once reviewed
  3. While you wait, you can start setting up your menu: {{portal_link}}
  Questions? Reply to this email or WhatsApp us at +234 800 CHOPFAST

## Template: merchant_approved
Subject: "🎉 Congratulations! Your ChopFast Store is Now Live"
Body:
  Hi {{owner_name}},
  Your restaurant "{{business_name}}" has been approved and is now live on ChopFast!
  Your store link: {{storefront_url}}
  Login to your merchant portal: {{portal_url}}
  What to do now:
  1. ✅ Complete your menu setup
  2. ✅ Set your delivery radius on the map
  3. ✅ Set your operating hours
  4. ✅ Upload great food photos
  Remember: ChopFast deducts 15% commission from each order's food subtotal.
  Your earnings are available in your wallet after each delivery.
  Let's start earning together! 🚀

## Template: merchant_rejected
Subject: "Update on Your ChopFast Merchant Application"
Body:
  Hi {{owner_name}},
  Thank you for your interest in joining ChopFast.
  After reviewing your application for "{{business_name}}", we're unable to approve
  it at this time for the following reason(s):
  {{rejection_reasons}}
  You're welcome to resubmit your application once these issues are resolved.
  Reapply here: {{apply_link}}
  If you believe this decision was made in error, please contact us: support@chopfast.ng

## Template: merchant_suspended
Subject: "⚠️ Your ChopFast Store Has Been Temporarily Suspended"
Body:
  Hi {{owner_name}},
  Your store "{{business_name}}" has been temporarily suspended from ChopFast.
  Reason: {{suspension_reason}}
  What this means:
  - Your store is hidden from customers
  - No new orders will be received
  - Your wallet balance is safe and accessible
  To appeal or resolve this issue, contact: merchants@chopfast.ng
  Reference: {{merchant_id}}

## Template: withdrawal_success
Subject: "💸 Your ChopFast Withdrawal Has Been Processed"
Body:
  Hi {{owner_name}},
  Your withdrawal of ₦{{amount}} has been sent to:
  Bank: {{bank_name}}
  Account: {{account_name}} — {{masked_account}}
  Reference: {{withdrawal_ref}}
  Please allow 1-3 business days for the funds to appear in your account.
  View your wallet: {{wallet_url}}

## Template: withdrawal_failed
Subject: "❌ ChopFast Withdrawal Could Not Be Processed"
Body:
  Hi {{owner_name}},
  Unfortunately, your withdrawal of ₦{{amount}} could not be processed.
  Reason: {{failure_reason}}
  The full amount has been restored to your ChopFast wallet.
  Please try again with a different bank account or contact your bank:
  {{wallet_url}}

## Template: monthly_invoice
Subject: "📊 Your ChopFast Monthly Statement — {{month}} {{year}}"
Body:
  Hi {{owner_name}},
  Your monthly statement for {{business_name}} is ready.
  Period: {{period_start}} to {{period_end}}
  Summary:
    Total Orders:       {{total_orders}}
    Gross Revenue:      ₦{{gross_revenue}}
    Commission Paid:    ₦{{commission_paid}}
    Net Earnings:       ₦{{net_earnings}}
    Total Withdrawn:    ₦{{total_withdrawn}}
    Closing Balance:    ₦{{closing_balance}}
  Download your full invoice: {{invoice_pdf_url}}
  Keep this for your records and tax filing.

## Template: new_order_alert (backup email if push fails)
Subject: "🔔 New Order on ChopFast — ₦{{order_total}}"
Body:
  You have a new order!
  Order: #{{order_reference}}
  Items: {{item_count}} item(s)
  Total: ₦{{order_total}}
  Your earnings: ₦{{merchant_net}}
  Please log in to accept or reject: {{portal_orders_url}}
  This order will auto-reject in 10 minutes if not actioned.

## Template: tier_upgrade
Subject: "🏆 You've Been Upgraded to {{new_tier}} Tier on ChopFast!"
Body:
  Congratulations {{owner_name}}!
  Based on your performance last month, "{{business_name}}" has been upgraded
  to {{new_tier}} tier.
  Your new commission rate: {{new_commission_rate}}% (was {{old_commission_rate}}%)
  Benefits unlocked: {{tier_benefits}}
  Keep up the great work! The next tier is {{next_tier}} at ₦{{next_tier_threshold}}/month GMV.

---

# assets/menu-import-template.csv
# CSV template for bulk menu import
# Merchants download this, fill it in, and upload

name,category,price,sale_price,description,is_available,spice_level,dietary_tags,prep_time_minutes,stock_quantity
Jollof Rice (Large),Rice Dishes,2500,,Our signature smoky jollof rice served with fried plantain,true,medium,halal,20,
Egusi Soup,Soups,3200,,Rich palm oil egusi soup with assorted meat,true,hot,"halal,gluten-free",25,
Suya (Beef),Grills,1800,,Spiced beef suya grilled over open flame,true,hot,halal,15,50
Puff Puff (6 pieces),Snacks,600,,Soft deep-fried Nigerian donuts,true,none,"vegetarian,halal",10,
Zobo Drink,Drinks,500,,Chilled hibiscus flower drink with ginger and pineapple,true,none,"vegetarian,halal",5,

---

# assets/env-config-checklist.md
# Environment Variables Checklist
# All variables required for multi-vendor feature to function

## Backend API (.env)

# Database
DATABASE_URL=postgresql://user:pass@host:5432/chopfast
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=<customer-jwt-secret>
JWT_REFRESH_SECRET=<customer-refresh-secret>
MERCHANT_JWT_SECRET=<merchant-jwt-secret-DIFFERENT-from-customer>
MERCHANT_JWT_REFRESH_SECRET=<merchant-refresh-secret>
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=30d

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=<webhook-hash-secret>

# Termii (SMS)
TERMII_API_KEY=<termii-api-key>
TERMII_SENDER_ID=ChopFast

# Cloudinary (document + image storage)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_MERCHANT_DOCS_PRESET=merchant_docs_unsigned
CLOUDINARY_MENU_IMAGES_PRESET=menu_images_unsigned

# SendGrid (email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@chopfast.ng
SENDGRID_FROM_NAME=ChopFast

# Google Maps
GOOGLE_MAPS_API_KEY=<server-side-maps-key>

# Firebase (push notifications)
FIREBASE_PROJECT_ID=chopfast-prod
FIREBASE_PRIVATE_KEY=<firebase-private-key>
FIREBASE_CLIENT_EMAIL=<firebase-client-email>

# Background jobs (BullMQ or pg-boss)
JOBS_QUEUE_PREFIX=chopfast
PENDING_BALANCE_HOLD_HOURS=2
DISPUTE_HOLD_HOURS=24

# Platform settings
PLATFORM_NAME=ChopFast
PLATFORM_SUPPORT_EMAIL=merchants@chopfast.ng
PLATFORM_SUPPORT_PHONE=+2348001234567
DEFAULT_COMMISSION_RATE=0.15
MIN_WITHDRAWAL_AMOUNT=1000
WITHDRAWAL_ADMIN_APPROVAL_THRESHOLD=500000
VAT_RATE=0.075

# Feature flags
FEATURE_MERCHANT_MOBILE_APP=true
FEATURE_FLASH_SALES=true
FEATURE_FEATURED_PLACEMENT=true
FEATURE_EMAIL_MARKETING=true
FEATURE_MULTI_LOCATION=true

## Frontend — Merchant Portal (.env.local)
NEXT_PUBLIC_API_URL=https://api.chopfast.ng
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<browser-maps-key>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=menu_images_unsigned
NEXT_PUBLIC_SOCKET_URL=https://api.chopfast.ng
NEXT_PUBLIC_MERCHANT_PORTAL_URL=https://merchant.chopfast.ng

## Frontend — Customer App (.env.local)
NEXT_PUBLIC_API_URL=https://api.chopfast.ng
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<browser-maps-key>
