---
name: ecommerce-restaurant-app
description: Build a complete, production-ready e-commerce restaurant web application from scratch. Use this skill whenever the user wants to create a restaurant website, food ordering app, menu system, online food delivery platform, takeaway ordering system, or any food-service e-commerce application. Also use when they mention features like menu management, cart systems, order tracking, payment integration, or restaurant dashboards — even if they don't explicitly say "restaurant app."
---

# E-Commerce Restaurant Web App Builder

Build a stunning, fully-featured restaurant e-commerce web application from project initialization to deployment-ready state. This skill covers the entire frontend and backend stack, producing a premium, modern app that handles menus, ordering, payments, user accounts, and admin management.

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14+ (App Router)** | SSR/SSG, API routes, file-based routing |
| Styling | **Vanilla CSS + CSS Custom Properties** | Full control, no build dependency, premium design |
| Database | **Supabase (PostgreSQL)** | Auth, realtime, storage, row-level security |
| Payments | **Paystack** | Africa-focused, easy integration, webhooks, subaccounts |
| State | **React Context + useReducer** | Lightweight, no extra deps for cart/auth state |
| Email | **Resend** or **Nodemailer** | Transactional order confirmations |
| Deployment | **Vercel** | Zero-config Next.js hosting |
| Maps | **Leaflet / Google Maps API** | Delivery radius, store locator |

> If the user requests a different stack, adapt accordingly. The architecture patterns remain the same.

## High-Level Build Sequence

Follow these phases in order. Each phase has a detailed reference file in `references/`.

### Phase 1 — Project Scaffold & Design System
Read: `references/01-scaffold-and-design.md`

1. Initialize Next.js project with App Router
2. Set up directory structure (components, lib, app routes, public assets)
3. Create the full CSS design system (tokens, typography, colors, spacing, animations)
4. Implement dark/light mode toggle
5. Build reusable layout components (Header, Footer, Navigation, Container)
6. Set up responsive breakpoints and mobile-first approach

### Phase 2 — Database & Authentication
Read: `references/02-database-and-auth.md`

1. Set up Supabase project and environment variables
2. Create database schema (users, menu_items, categories, orders, order_items, reviews, addresses, coupons)
3. Implement Row-Level Security policies
4. Build authentication flow (sign up, login, password reset, OAuth providers)
5. Create auth context and protected routes
6. Build user profile management

### Phase 3 — Menu & Product System
Read: `references/03-menu-and-products.md`

1. Build category listing page with filtering
2. Create individual menu item cards with imagery, dietary tags, pricing
3. Implement item detail modal/page with customization options (size, extras, special instructions)
4. Add search functionality with debounced input
5. Build featured items / specials / deals section
6. Implement image optimization and lazy loading

### Phase 4 — Cart & Checkout
Read: `references/04-cart-and-checkout.md`

1. Build cart context with add/remove/update/clear actions
2. Create slide-out cart drawer with item list, quantities, subtotals
3. Implement persistent cart (localStorage + database sync for logged-in users)
4. Build multi-step checkout flow (delivery/pickup → address → payment → confirm)
5. Add coupon/promo code system
6. Calculate delivery fees, taxes, and order totals

### Phase 5 — Payments & Order Processing
Read: `references/05-payments-and-orders.md`

1. Integrate Paystack Popup or Paystack Inline for payment collection
2. Set up Paystack webhook handler for payment confirmation
3. Build order creation and status management
4. Implement order confirmation page with summary
5. Send order confirmation emails
6. Create real-time order status updates (preparing → ready → out for delivery → delivered)

### Phase 6 — User Dashboard
Read: `references/06-user-dashboard.md`

1. Build order history with filtering and pagination
2. Create order detail view with real-time status tracking
3. Implement address book management (add/edit/delete delivery addresses)
4. Build favorites/saved items system
5. Add review and rating system for menu items
6. Create notification preferences

### Phase 7 — Admin Dashboard
Read: `references/07-admin-dashboard.md`

1. Build protected admin layout with role-based access
2. Create menu management CRUD (add/edit/delete items, categories, modifiers)
3. Build order management queue with real-time updates
4. Implement analytics dashboard (revenue, popular items, peak hours)
5. Create customer management view
6. Build coupon/promotion management
7. Add inventory/availability toggles

### Phase 8 — SEO, Performance & Polish
Read: `references/08-seo-and-polish.md`

1. Implement metadata, Open Graph, and JSON-LD structured data
2. Add sitemap.xml and robots.txt generation
3. Optimize Core Web Vitals (LCP, CLS, FID)
4. Implement error boundaries and loading states
5. Add toast notifications for user feedback
6. Build 404 and error pages
7. Implement accessibility (ARIA labels, keyboard navigation, screen reader support)

### Phase 9 — Advanced Features
Read: `references/09-advanced-features.md`

1. Delivery zone mapping with radius calculations
2. Scheduled/pre-ordering system
3. Real-time order tracking with driver location (optional)
4. Multi-language support (i18n)
5. Push notifications (optional)
6. Loyalty/rewards program
7. Table reservation system (optional dine-in feature)
8. Blog/content section for restaurant news and recipes

---

## Design Standards

Every restaurant app built with this skill must feel **premium and alive**. These are non-negotiable:

### Visual Identity
- Use a curated color palette based on food/restaurant aesthetics — warm tones (amber, terracotta, olive, cream) or sleek modern (dark charcoal, gold accents, white)
- Never use raw CSS color names like `red`, `blue`, `green`
- Use HSL-based colors for easy theming
- Typography from Google Fonts: pair a display font (e.g., Playfair Display, DM Serif) with a clean body font (e.g., Inter, DM Sans)

### Micro-Interactions
- Smooth hover transforms on cards (slight lift + shadow)
- Cart icon bounce animation on add-to-cart
- Skeleton loading states for async content
- Page transitions with subtle fade/slide
- Button press feedback (scale transform)
- Toast/snackbar for confirmations

### Responsive Design
- Mobile-first CSS approach
- Sticky mobile bottom navigation bar
- Touch-friendly tap targets (min 44px)
- Collapsible hamburger menu with smooth slide animation
- Full-width cards on mobile, grid on desktop

### Imagery
- Use the `generate_image` tool to create hero images, food photography placeholders, and brand assets
- Never leave broken image placeholders — always generate or provide real visuals

---

## File Structure

```
restaurant-app/
├── app/
│   ├── layout.js              # Root layout (fonts, metadata, providers)
│   ├── page.js                # Homepage (hero, featured, categories)
│   ├── globals.css            # Design system + global styles
│   ├── menu/
│   │   ├── page.js            # Full menu with categories
│   │   └── [slug]/page.js     # Individual item detail
│   ├── cart/page.js           # Cart page (mobile full-page view)
│   ├── checkout/
│   │   ├── page.js            # Multi-step checkout
│   │   └── success/page.js    # Order confirmation
│   ├── account/
│   │   ├── page.js            # User dashboard
│   │   ├── orders/page.js     # Order history
│   │   ├── addresses/page.js  # Address book
│   │   └── settings/page.js   # Profile settings
│   ├── auth/
│   │   ├── login/page.js      # Login
│   │   ├── signup/page.js     # Register
│   │   └── reset/page.js      # Password reset
│   ├── admin/
│   │   ├── layout.js          # Admin layout (sidebar nav)
│   │   ├── page.js            # Admin dashboard (analytics)
│   │   ├── menu/page.js       # Menu CRUD
│   │   ├── orders/page.js     # Order management
│   │   ├── customers/page.js  # Customer list
│   │   └── settings/page.js   # Store settings
│   └── api/
│       ├── auth/[...supabase]/route.js
│       ├── orders/route.js
│       ├── paystack/
│       │   ├── initialize/route.js
│       │   └── webhook/route.js
│       └── menu/route.js
├── components/
│   ├── layout/                # Header, Footer, Sidebar, MobileNav
│   ├── menu/                  # MenuCard, MenuGrid, CategoryFilter, ItemModal
│   ├── cart/                  # CartDrawer, CartItem, CartSummary
│   ├── checkout/              # CheckoutForm, AddressForm, PaymentForm
│   ├── ui/                    # Button, Input, Modal, Toast, Skeleton, Badge
│   ├── admin/                 # AdminTable, StatsCard, OrderQueue
│   └── shared/                # Logo, Rating, SearchBar, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── client.js          # Browser Supabase client
│   │   ├── server.js          # Server Supabase client
│   │   └── admin.js           # Service-role client (webhooks)
│   ├── paystack.js            # Paystack initialization
│   ├── utils.js               # Formatters, validators, helpers
│   └── constants.js           # App-wide constants
├── context/
│   ├── AuthContext.js         # Authentication state
│   ├── CartContext.js         # Cart state and actions
│   └── ThemeContext.js        # Dark/light mode
├── hooks/
│   ├── useAuth.js
│   ├── useCart.js
│   ├── useOrders.js
│   └── useMenu.js
├── public/
│   ├── images/                # Generated assets
│   └── fonts/                 # Local font files (if not using CDN)
├── .env.local                 # Environment variables
├── next.config.js
└── package.json
```

---

## Critical Reminders

1. **Generate real images** — use the `generate_image` tool for hero banners, food items, and branding. Placeholder images are unacceptable.
2. **Environment variables** — always use `.env.local` for secrets. Never hardcode API keys.
3. **Error handling** — every API route and data fetch needs try/catch with meaningful error messages.
4. **Loading states** — every async operation must show a skeleton or spinner. No blank flashes.
5. **Mobile-first** — design for mobile screens first, enhance for desktop. Test at 375px width.
6. **Accessibility** — semantic HTML, ARIA labels, focus management, color contrast ratios ≥ 4.5:1.
7. **Security** — validate all inputs server-side, use RLS policies, sanitize user content, CSRF protection.

---

## Quick Start Checklist

When the user says "build me a restaurant app" or similar, follow this exact sequence:

1. Ask the user for: restaurant name, cuisine type, color preference, and which features to prioritize
2. Read `references/01-scaffold-and-design.md` and scaffold the project
3. Generate brand imagery using the `generate_image` tool
4. Build phase by phase, referencing the appropriate file for each
5. After each major phase, verify the build runs without errors
6. Generate screenshots of the app to show the user progress

If the user wants to skip the planning and jump straight to building, start with Phase 1 using sensible defaults and iterate from there.
