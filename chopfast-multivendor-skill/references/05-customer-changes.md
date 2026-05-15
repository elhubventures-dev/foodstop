# Reference 05 — Customer-Facing Changes

## Restaurant Discovery Page (/restaurants)

### Layout
- Hero: "Explore Restaurants Near You" + location input + search bar
- Active filters bar (chips showing applied filters with × to remove)
- Sort dropdown: Relevance | Rating | Delivery Time | Min Order
- Results grid: 2 cols mobile, 3 cols tablet, 4 cols desktop

### Restaurant Card
```
┌─────────────────────────────┐
│  [Banner Image]             │
│  🟢 Open · 35 min           │
├─────────────────────────────┤
│  [Logo] Mama Titi Kitchen   │
│  Local Cuisine · ₦₦        │
│  ⭐ 4.8 (312) · 3.2km away  │
│  Min order: ₦1,500          │
│  Delivery: ₦500             │
│  [NEW] [FEATURED]           │
└─────────────────────────────┘
```

Badges shown on card:
- 🟢 Open / 🔴 Closed / 🕐 Opens at 11am
- NEW (within first 30 days on platform)
- FEATURED (paid placement — gold banner)
- ⚡ Fast Delivery (avg < 25 min)
- 🏆 Top Rated (4.8+)
- CHOPFAST PICK (editorial choice)

### Filter Sidebar / Sheet
```
Open Now:          [● toggle]
Free Delivery:     [● toggle]
Min Order:         [₦0 ──●────── ₦5,000]
Cuisine Type:      [☑ Nigerian] [☑ Chinese] [☐ Continental] ...
Rating:            [○ Any] [○ 4.0+] [● 4.5+] [○ 4.8+]
Distance:          [1km ──────●── 10km]
Dietary:           [☐ Halal] [☐ Vegetarian]
```

### Featured Sections
- "Featured Restaurants" row (paid placement, max 3-5 slots)
- "New on ChopFast" row (recently onboarded, first 30 days)
- "Top Rated Near You" row (sorted by rating)
- "Fast Delivery" row (avg delivery time < 25 min)

---

## Merchant Storefront Page (/restaurants/[slug])

### Header
- Full-width banner image
- Merchant logo (circular, overlapping banner bottom)
- Business name (H1)
- Cuisine tags | Price range | ⭐ Rating (X reviews) | X orders served
- 🟢 Open · Delivery in ~35 mins · 3.2km away
- Min order: ₦1,500 | Delivery fee: ₦500
- [Share Store] [❤ Favourite] [Report Store]

### Menu Section (same UX as single-restaurant)
- Sticky horizontal category tabs
- Items grid per category
- Same food card design, customization modal, add to cart

### About Section
- Merchant description
- Operating hours table (all 7 days)
- Address with map embed
- Merchant phone (if opted in to show)

### Promotions Banner (if merchant has active promos)
- "🎉 Use code MAMA20 for 20% off your first order"

### Reviews Section
```
Overall: ⭐ 4.8 — 312 reviews

Rating breakdown bars
[5⭐ ████████ 85%]
[4⭐ ███       10%]
...

REVIEWS (most recent first):
  ⭐⭐⭐⭐⭐  Chidi E. — 1 day ago
  "Best egusi soup in Abuja. Delivery was fast too!"
  🏪 Merchant: "Thank you Chidi! We're glad you enjoyed it!"
```

---

## Cart — Single-Merchant Enforcement

```typescript
// Frontend cart store (Zustand or Redux)
function addToCart(item: MenuItem) {
  const { items, merchantId: currentMerchantId } = get();

  if (currentMerchantId && currentMerchantId !== item.merchantId) {
    // Trigger confirmation modal
    set({ pendingItem: item, showMerchantConflictModal: true });
    return;
  }

  set((state) => ({
    merchantId: item.merchantId,
    merchantName: item.merchantName,
    items: [...state.items, item],
  }));
}
```

### Conflict Modal
```
┌─────────────────────────────────────────┐
│  Start a new order?                     │
│                                         │
│  Your cart has items from               │
│  "Mama Titi Kitchen"                    │
│                                         │
│  Adding items from "Lagos Grill House"  │
│  will clear your current cart.          │
│                                         │
│  [Keep Mama Titi]   [Start New Order]   │
└─────────────────────────────────────────┘
```

---

## Global Search (spanning all merchants)

### Route: /search?q=jollof&lat=6.5&lng=3.3

### Results Page
- Two tabs: 🍽️ Food Items (X) | 🏪 Restaurants (X)

Food Items tab:
- Shows matching menu items across ALL merchants
- Card: item image, name, merchant name (clickable), price, rating, [Add to Cart]

Restaurants tab:
- Shows merchants whose name or cuisine matches query
- Standard restaurant card

### Algolia / PostgreSQL Full-Text Search
```sql
-- Add full-text search index
ALTER TABLE menu_items ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
  ) STORED;
CREATE INDEX idx_menu_items_search ON menu_items USING gin(search_vector);

ALTER TABLE merchants ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(business_name,'') || ' ' || coalesce(description,''))
  ) STORED;
CREATE INDEX idx_merchants_search ON merchants USING gin(search_vector);

-- Query
SELECT mi.*, m.business_name, m.slug, m.avg_rating
FROM menu_items mi
JOIN merchants m ON mi.merchant_id = m.id
WHERE mi.search_vector @@ plainto_tsquery('english', $1)
  AND m.is_active = true
  AND mi.is_available = true
  AND ST_DWithin(m.location, ST_Point($2, $3)::geography, $4 * 1000)
ORDER BY ts_rank(mi.search_vector, plainto_tsquery('english', $1)) DESC
LIMIT 20;
```

---

## Homepage Multi-Vendor Changes

New sections to inject into existing homepage:

1. **After hero:** "Order Type" selector now shows: Delivery | Pickup | Dine-In (unchanged)
2. **New section:** "Explore Restaurants Near You" — 4-card horizontal scroll with "See All →" link
3. **New section:** "Featured Today" — 3 featured merchant cards (paid placement)
4. **New section:** "New on ChopFast" — recently joined restaurants (last 30 days)
5. **Existing section:** Keep "Popular Items" section but now cross-merchant
6. **New section:** "Top Rated" — merchants with rating 4.7+

---

## Order Tracking — Merchant Branding

Tracking page header:
```
[ChopFast logo]  ×  [Merchant Logo]
Your order from Mama Titi Kitchen
Order #CF-2047
```

Status timeline labels now say:
- "Mama Titi Kitchen confirmed your order"
- "Mama Titi Kitchen is preparing your food"
- "Your order is ready for pickup by your rider"
- "Rider is on the way"
- "Delivered! 🎉"

---

## Post-Delivery Review — Two Separate Ratings

```
HOW WAS YOUR ORDER FROM MAMA TITI KITCHEN?

Restaurant Rating:
  [⭐ ⭐ ⭐ ⭐ ⭐]
  Food quality, portion size, presentation

  [Write a review... (optional)]
  [📷 Add photo]

Rider Rating:
  [⭐ ⭐ ⭐ ⭐ ⭐]
  Speed, professionalism, communication

[Skip]  [Submit Review]
```
