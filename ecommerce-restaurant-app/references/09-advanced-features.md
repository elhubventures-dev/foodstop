# Phase 9 — Advanced Features

These are optional enhancements that elevate the app from good to production-grade. Implement based on the user's requirements and priorities.

## 1. Delivery Zone Mapping

### Database
```sql
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS delivery_zones JSONB;

-- Example zones:
-- [
--   { "name": "Zone 1 (0-3km)", "radius_km": 3, "fee": 0, "min_order": 20 },
--   { "name": "Zone 2 (3-7km)", "radius_km": 7, "fee": 3.99, "min_order": 30 },
--   { "name": "Zone 3 (7-10km)", "radius_km": 10, "fee": 5.99, "min_order": 40 }
-- ]
```

### Distance Calculation
Use the Haversine formula to calculate distance from restaurant to delivery address:

```js
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) { return deg * (Math.PI / 180); }
```

### Map Display
Use Leaflet (free, open-source) to show the delivery radius:
```bash
npm install leaflet react-leaflet
```

Show a map on the checkout page with:
- Restaurant marker at center
- Delivery zone circles (color-coded by fee tier)
- Customer's delivery address marker
- Auto-zoom to fit both points

## 2. Scheduled / Pre-Ordering

Allow customers to place orders for a future time.

### Database
```sql
ALTER TABLE orders ADD COLUMN scheduled_for TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE;
```

### UI
- Time picker in checkout: "ASAP" (default) or "Schedule for later"
- Calendar date picker + time slot dropdown
- Available time slots based on store operating hours
- Minimum advance time (e.g., 30 minutes from now)
- Maximum advance time (e.g., 7 days)

### Logic
- Scheduled orders get `confirmed` status immediately after payment
- Admin sees scheduled orders in a separate tab sorted by scheduled time
- Notification to kitchen at appropriate prep time before scheduled delivery

## 3. Real-Time Order Tracking

### Status Updates with Timestamps
```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO order_status_history (order_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status();
```

### Tracking UI
- Visual progress bar showing current step
- Estimated time countdown
- Map showing rider location (if driver tracking is implemented)
- Push notification on each status change (if enabled)

## 4. Multi-Language Support (i18n)

### Using next-intl
```bash
npm install next-intl
```

### Structure
```
messages/
├── en.json
├── es.json
├── fr.json
└── ar.json
```

### Message Format
```json
{
  "nav": {
    "home": "Home",
    "menu": "Menu",
    "cart": "Cart",
    "account": "Account"
  },
  "menu": {
    "addToCart": "Add to Cart",
    "viewDetails": "View Details",
    "search": "Search menu...",
    "noResults": "No items found"
  },
  "cart": {
    "empty": "Your cart is empty",
    "checkout": "Proceed to Checkout",
    "subtotal": "Subtotal",
    "deliveryFee": "Delivery Fee",
    "total": "Total"
  }
}
```

### Usage
```jsx
import { useTranslations } from 'next-intl';

function CartButton() {
  const t = useTranslations('cart');
  return <button>{t('checkout')}</button>;
}
```

### Language Switcher Component
- Dropdown in header/footer
- Flag icons for each language
- Persist selection in localStorage and cookie
- RTL support for Arabic and similar languages

## 5. Loyalty / Rewards Program

### Database
```sql
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- Bronze, Silver, Gold, Platinum
  min_points INTEGER NOT NULL,
  benefits JSONB,              -- { "discount_percent": 5, "free_delivery": false }
  badge_color TEXT
);
```

### Earning Rules
- 1 point per $1 spent
- Bonus points for first order, birthday, referrals
- Double points on certain days or items

### Redemption
- Points can be converted to discount at checkout
- Example: 100 points = $5 off
- Tier benefits (free delivery, exclusive menu items, priority support)

### UI
- Points balance in header/account
- Current tier with progress bar to next tier
- Points history in account dashboard
- "Earn X points" badge on menu items

## 6. Table Reservation System

### Database
```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  seats INTEGER NOT NULL,
  location TEXT,               -- indoor, outdoor, private
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  table_id UUID REFERENCES tables(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  party_size INTEGER NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,      -- e.g., '18:00'
  duration_minutes INTEGER DEFAULT 90,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Reservation Page
- Date picker (calendar view)
- Party size selector
- Available time slots (dynamically calculated based on table availability)
- Guest details form
- Special requests textarea
- Confirmation with calendar invite download

## 7. Blog / Content Section

### Database
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Features
- Blog listing page with card grid
- Individual blog post pages with rich content
- Tags and filtering
- Share buttons (social media)
- Related posts suggestion
- Admin blog post editor (markdown or rich text)
- SEO metadata per post

## 8. Push Notifications (Optional)

Use the Web Push API for browser notifications:
- New order notifications for admin
- Order status updates for customers
- Promotional notifications (new items, deals)
- Requires VAPID keys and a service worker

### Setup
```bash
npm install web-push
```

Generate VAPID keys and store in `.env.local`.
Create a service worker for handling push events.
Add notification permission request UI with clear opt-in flow.

## 9. Social Sharing

Add share buttons to menu items and blog posts:
- Copy link to clipboard
- Share to WhatsApp, Facebook, Twitter/X
- Native Web Share API on mobile devices

```js
const shareItem = async (item) => {
  if (navigator.share) {
    await navigator.share({
      title: item.name,
      text: `Check out ${item.name} from Restaurant Name!`,
      url: `${window.location.origin}/menu/${item.slug}`,
    });
  } else {
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(`${window.location.origin}/menu/${item.slug}`);
    toast.success('Link copied!');
  }
};
```
