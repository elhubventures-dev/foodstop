# Phase 7 — Admin Dashboard

## Admin Layout (`app/admin/layout.js`)

### Sidebar Navigation
- Restaurant logo at top
- Navigation sections:
  - **Dashboard** (analytics overview)
  - **Orders** (live queue with badge count for pending)
  - **Menu** (items and categories CRUD)
  - **Customers** (user management)
  - **Coupons** (promo management)
  - **Reviews** (moderation)
  - **Settings** (store configuration)
- Collapse/expand toggle for sidebar
- Active page indicator (primary color bar on left)
- User info + logout at bottom
- Mobile: slide-in overlay sidebar with hamburger trigger

### CSS
```css
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: var(--sidebar-width);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-sticky);
  transition: transform var(--transition-base);
}

.admin-sidebar--collapsed {
  transform: translateX(-100%);
}

.admin-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--space-6);
  background: var(--color-bg);
}

@media (max-width: 768px) {
  .admin-content {
    margin-left: 0;
  }
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  position: relative;
}

.admin-nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.admin-nav-item--active {
  background: hsla(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1);
  color: var(--color-primary);
  font-weight: 600;
}

.admin-nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--color-primary);
  border-radius: 0 2px 2px 0;
}

.admin-nav-badge {
  margin-left: auto;
  background: var(--color-error);
  color: white;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}
```

## Analytics Dashboard (`app/admin/page.js`)

### Stats Cards (Top Row)
Display 4 key metrics in a grid:
1. **Today's Revenue** — sum of today's completed orders, with % change from yesterday
2. **Total Orders** — today's count, with trend arrow
3. **Active Orders** — currently preparing/delivering
4. **Average Order Value** — mean total across recent orders

Each card has:
- Icon (color-coded)
- Metric value (large font)
- Label
- Trend indicator (up/down arrow with % change, green/red)

### Stats Card CSS
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--revenue { background: hsla(145, 60%, 42%, 0.1); color: var(--color-success); }
.stat-card__icon--orders { background: hsla(210, 80%, 55%, 0.1); color: var(--color-info); }
.stat-card__icon--active { background: hsla(var(--color-primary-h), 85%, 55%, 0.1); color: var(--color-primary); }
.stat-card__icon--average { background: hsla(270, 60%, 55%, 0.1); color: hsl(270, 60%, 55%); }

.stat-card__value {
  font-size: var(--text-3xl);
  font-weight: 700;
  line-height: 1.2;
}

.stat-card__trend {
  font-size: var(--text-sm);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.stat-card__trend--up { color: var(--color-success); }
.stat-card__trend--down { color: var(--color-error); }
```

### Charts Section
- **Revenue chart**: Line/area chart showing daily revenue for last 30 days
- **Popular items**: Horizontal bar chart of top 10 items by order count
- **Orders by hour**: Bar chart showing peak ordering times
- **Order types**: Pie/donut chart of delivery vs pickup vs dine-in

For charts, use a lightweight library like Chart.js or build simple CSS-based charts for basic visualization. Install Chart.js if needed: `npm install chart.js react-chartjs-2`

### Recent Orders Table
Show last 10 orders with columns:
- Order # (link to detail)
- Customer name
- Items (truncated)
- Total
- Status (color-coded badge)
- Time placed
- Actions (view, update status)

## Order Management (`app/admin/orders/page.js`)

### Live Order Queue
- Real-time updates via Supabase Realtime
- Kanban-style columns: Pending → Confirmed → Preparing → Ready → Out for Delivery/Picked Up
- Or a list view with filter tabs per status
- Audio notification for new orders (optional)
- Quick status update buttons (advance to next status)
- Click to expand order details

### Order Detail Panel
- Customer info and contact
- Full item list with modifiers
- Delivery address with map link
- Special instructions (highlighted)
- Status update dropdown
- Estimated time adjustment
- Cancel order button (with refund option)
- Print order ticket (optional)

### Real-time Subscription
```js
useEffect(() => {
  const channel = supabase
    .channel('admin-orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders',
    }, (payload) => {
      if (payload.eventType === 'INSERT') {
        setOrders(prev => [payload.new, ...prev]);
        // Play notification sound
        playSound();
        toast.success(`New order #${payload.new.order_number}!`);
      } else if (payload.eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
      }
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## Menu Management (`app/admin/menu/page.js`)

### Category Management
- List of categories with drag-to-reorder
- Add/Edit category modal: name, slug (auto-generated), description, image, active toggle
- Delete with confirmation (check for associated items first)

### Menu Item CRUD
- Table or card grid view toggle
- Columns: image, name, category, price, availability, featured, actions
- Bulk actions: enable/disable, delete, change category
- Add/Edit item form (full-page or side panel):
  - Name, slug (auto-generated from name)
  - Category dropdown
  - Description (rich text or textarea)
  - Price and compare price
  - Image upload (to Supabase Storage)
  - Multiple images support
  - Dietary tags (multi-select checkboxes)
  - Allergens input
  - Prep time, calories, spice level
  - Featured toggle, New badge toggle
  - Active/Available toggle
  - Modifier groups management (inline)
- Form validation: required name, valid price, at least one category

### Image Upload to Supabase Storage
```js
const uploadImage = async (file) => {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2)}.${ext}`;
  const filePath = `menu/${fileName}`;

  const { error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

## Customer Management (`app/admin/customers/page.js`)

- Searchable customer list
- Columns: name, email, orders count, total spent, joined date
- Click to view customer detail: profile info, order history, addresses
- Admin cannot delete customers (privacy compliance) but can change roles

## Coupon Management

- List of all coupons
- Add/Edit form: code, type (percentage/fixed), value, min order, max discount, usage limit, validity dates, active toggle
- Usage stats: how many times used, revenue impact
- Quick enable/disable toggle
- Delete with confirmation

## Store Settings (`app/admin/settings/page.js`)

- Restaurant information (name, address, phone, email)
- Operating hours editor (per day of week)
- Delivery settings (base fee, free threshold, max radius)
- Tax rate configuration
- Payment settings
- Notification settings
- Appearance settings (logo, colors — optional theme customization)
