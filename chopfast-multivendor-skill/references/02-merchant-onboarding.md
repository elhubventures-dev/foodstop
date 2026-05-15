# Reference 02 — Merchant Auth & Onboarding

## "Become a Vendor" Public Landing Page

Route: `/become-a-vendor`

Sections:
1. Hero — "List Your Restaurant on ChopFast — Reach Thousands of Hungry Customers Daily"
2. 3-Step Explainer — Register (5 min) → Set Up Menu (your pace) → Start Earning (from day 1)
3. Commission Transparency Block — "ChopFast takes only 15% per order. You keep 85%. No hidden fees. No monthly subscription."
4. Benefits Grid (6 cards): Free Listing | Real-Time Dashboard | Same-Day Wallet Credit | Marketing Exposure | Dedicated Support | Analytics & Insights
5. Tier Teaser — "High-volume restaurants unlock lower commission rates. Gold merchants pay just 11%."
6. Testimonials carousel (3 mock merchant quotes with photos)
7. FAQ Accordion (8 questions — commission, payout, documents, approval timeline, etc.)
8. Final CTA — "Apply Now — Free to Join"

---

## Registration Form — 5 Steps

### All steps: auto-save draft to localStorage. User can resume.

---

### Step 1 — Business Information
```
Fields:
  business_name        (required, 2-200 chars)
  business_email       (required, unique, email format)
  business_phone       (required, Nigerian format: 080XXXXXXXX or +2348XXXXXXXXX)
  category             (dropdown: Fast Food | Local Cuisine | Fine Dining | Bakery |
                         Cloud Kitchen | Grills & BBQ | Chinese | Continental | Other)
  cuisine_types        (multiselect checkboxes, max 5)
  city                 (dropdown: Lagos | Abuja | Port Harcourt | Kano | Ibadan |
                         Benin City | Enugu | Kaduna | Jos | Warri | Other)
  state                (auto-filled from city, editable)
  business_address     (Google Maps Places autocomplete — Nigeria only)
  description          (textarea, 50-500 chars, "Tell customers about your restaurant")
  number_of_locations  (radio: Just 1 | 2-5 | More than 5)

Validation:
  - business_email: real-time uniqueness check (debounced API call)
  - business_phone: regex + live format hint
  - address: must resolve to a Nigeria lat/lng
```

### Step 2 — Owner Information
```
Fields:
  owner_name       (required, full name)
  owner_phone      (required, different from business phone OK)
  owner_email      (required, can match business email)
  password         (required, min 8 chars, 1 uppercase, 1 number, 1 special)
  confirm_password (required, must match)
  nin_or_bvn       (required, 11 digits, label: "NIN or BVN — for identity verification")
  nin_bvn_type     (radio: NIN | BVN)

Note shown to user:
  "Your NIN/BVN is encrypted and used only for regulatory identity verification.
   It is never shared with third parties."

OTP Verification (on Next button):
  - Send OTP to owner_email via Resend
  - 6-digit input UI (individual boxes)
  - Resend after 60s countdown
  - 3 attempts max, lockout for 10 minutes after
  - On verify: proceed to step 3
```

### Step 3 — KYC Document Upload
```
Documents:
  CAC Certificate      (required) — Corporate Affairs Commission business reg
  Owner Valid ID       (required) — NIN slip | Driver's License | Int'l Passport
  Utility Bill         (required) — proof of business address (last 3 months)
  NAFDAC Permit        (optional) — food handler / production permit
  FSSAI Certificate    (optional) — food safety cert

Upload UI:
  - Drag-and-drop + click to upload
  - Accepted: PDF, JPG, PNG (max 5MB per file)
  - Upload to Cloudinary directly from browser (signed upload preset)
  - Preview thumbnail after upload
  - Remove and re-upload option

Note shown:
  "Documents are reviewed within 24-48 hours. You'll be notified by email and SMS."
  "You can start setting up your menu while awaiting review."
```

### Step 4 — Banking Information
```
Fields:
  bank_name       (dropdown of all CBN-licensed Nigerian banks, sorted by popularity)
  account_number  (10-digit NUBAN, numeric only)
  account_name    (auto-fetched via Paystack Resolve Account API — read-only display)

Flow:
  1. User enters bank_name + account_number
  2. On blur / after 10 digits: call Paystack resolve endpoint
     GET https://api.paystack.co/bank/resolve?account_number=XXXXXXXXXX&bank_code=XXX
  3. Show loading spinner
  4. On success: display account_name in green ("✓ Emeka Okafor")
  5. On failure: show red error ("Account not found — please check your details")
  6. User must confirm: checkbox "Yes, this is my correct account name"

Terms:
  - Checkbox: "I agree to the ChopFast Merchant Agreement" (link opens modal/new tab)
  - Checkbox: "I understand ChopFast deducts 15% commission from each order's food subtotal"
```

### Step 5 — Review & Submit
```
Summary display:
  - Business name, email, phone, city
  - Owner name
  - Documents uploaded (checkmark list)
  - Bank: [Bank Name] — [Masked Account: XXXXXX1234] — [Account Name]
  - Commission: "15% of food subtotal per order"

Submit button → POST /merchant/register

On success:
  - Show confirmation screen (not a redirect)
  - Application reference number displayed
  - "We'll email you at [email] and SMS you at [phone] within 24-48 hours"
  - CTA: "Set Up Your Menu While You Wait →" (takes to limited merchant dashboard)
```

---

## Merchant Auth System

### Separate JWT scope from customer auth:
```typescript
// merchant.auth.service.ts
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET; // different from customer secret

function signMerchantToken(merchantId: string, userId: string) {
  return jwt.sign(
    { merchantId, userId, role: 'merchant', iat: Date.now() },
    MERCHANT_JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function signMerchantRefreshToken(merchantId: string) {
  return jwt.sign(
    { merchantId, role: 'merchant_refresh' },
    MERCHANT_JWT_SECRET + '_refresh',
    { expiresIn: '30d' }
  );
}
```

### Login page route: `/merchant/login`
- Email + password
- OTP 2FA: if merchant has 2FA enabled, send OTP to phone after password verified
- "Remember this device for 30 days" — skip 2FA on trusted devices
- Forgot password: OTP to registered email OR phone → reset

### Session:
- Access token: 8h expiry
- Refresh token: 30d, stored in httpOnly cookie
- Inactivity timeout: 30 minutes (frontend timer clears token, redirect to login)

---

## Admin Approval Workflow

### New Application Queue (Super Admin panel)
- Table: merchant name | city | category | submitted | documents | status | actions
- Sort by: Oldest first (FIFO) — SLA tracking
- SLA badge: turns yellow after 24h, red after 48h
- Filter: pending | approved | rejected | more_info_requested

### Per-Application Review Screen
```
Left panel: Application summary (all fields from registration)
Right panel: Document viewer (inline PDF/image viewer, Cloudinary CDN)

Actions:
  Approve:
    - Sets merchants.is_active = true, is_verified = true
    - Creates merchant_wallet record
    - Creates merchant_tiers record (tier: 'bronze')
    - Sends approval email (template: merchant_approved)
    - Sends approval SMS: "Congratulations! Your ChopFast merchant account has been approved. Login at merchant.chopfast.ng"
    - Creates merchant_notification (type: 'account_approved')

  Reject (requires reason selection + optional note):
    - Sets merchants.is_active = false, is_verified = false
    - Sends rejection email with reason + resubmission instructions
    - Sends rejection SMS

  Request More Info:
    - Sends email listing what additional info/documents are needed
    - Application status: 'more_info_requested'
    - Merchant portal shows banner: "Action Required — Check your email for document requests"
```

---

## Limited Merchant Dashboard (pre-approval)

While awaiting verification, merchant can access:
- ✅ Set up menu (items saved but not visible to customers)
- ✅ Upload/re-upload documents
- ✅ Edit store profile (logo, description, hours)
- ❌ Cannot receive orders
- ❌ Cannot access wallet

Banner shown: "🕐 Your application is under review. Once approved, your store will go live automatically."

---

## Nigerian Bank List (bank_code mapping for Paystack)

```json
[
  { "name": "Access Bank", "code": "044" },
  { "name": "GTBank", "code": "058" },
  { "name": "First Bank", "code": "011" },
  { "name": "Zenith Bank", "code": "057" },
  { "name": "UBA", "code": "033" },
  { "name": "Stanbic IBTC", "code": "221" },
  { "name": "FCMB", "code": "214" },
  { "name": "Fidelity Bank", "code": "070" },
  { "name": "Union Bank", "code": "032" },
  { "name": "Sterling Bank", "code": "232" },
  { "name": "Wema Bank", "code": "035" },
  { "name": "Polaris Bank", "code": "076" },
  { "name": "Opay", "code": "999992" },
  { "name": "Palmpay", "code": "999991" },
  { "name": "Kuda Bank", "code": "090267" },
  { "name": "Moniepoint", "code": "090405" }
]
```
