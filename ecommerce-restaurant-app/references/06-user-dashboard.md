# Phase 6 — User Dashboard

## Dashboard Layout (`app/account/page.js`)

### Structure
- Welcome message with user's name and avatar
- Quick stats: total orders, pending orders, loyalty points
- Recent orders preview (last 3)
- Saved addresses count
- Favorite items count
- Quick action cards (New Order, Reorder Last, Write Review)

### Navigation
Desktop: sidebar with icon + text links
Mobile: top tabs or grid of icon cards

Sections:
- Dashboard (overview)
- My Orders
- Addresses
- Favorites
- Reviews
- Settings

## Order History (`app/account/orders/page.js`)

### Features
- List of all past orders, newest first
- Filter by status: All, Active, Completed, Cancelled
- Search by order number
- Pagination (10 per page) or infinite scroll
- Each order card shows:
  - Order number and date
  - Status badge (color-coded)
  - Item summary (first 2-3 items + "and X more")  
  - Total amount
  - "View Details" button
  - "Reorder" button (adds all items back to cart)

### Order Detail View (`app/account/orders/[id]/page.js`)
- Full order information
- Status timeline (vertical stepper showing each status change with timestamps)
- Item list with images, modifiers, quantities, prices
- Price breakdown
- Delivery address with map preview
- Contact support button
- Leave review button (for delivered orders)
- Download receipt as PDF (optional)

### Status Timeline CSS
```css
.order-timeline {
  position: relative;
  padding-left: var(--space-8);
}

.order-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border);
}

.timeline-step {
  position: relative;
  padding-bottom: var(--space-6);
}

.timeline-step__dot {
  position: absolute;
  left: calc(-1 * var(--space-8) + 8px);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-border);
  border: 3px solid var(--color-bg);
}

.timeline-step--completed .timeline-step__dot {
  background: var(--color-success);
}

.timeline-step--active .timeline-step__dot {
  background: var(--color-primary);
  box-shadow: 0 0 0 4px hsla(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.2);
  animation: pulse 2s infinite;
}

.timeline-step__title {
  font-weight: 600;
  margin-bottom: var(--space-1);
}

.timeline-step__time {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

## Address Book (`app/account/addresses/page.js`)

### Features
- List of saved addresses as cards
- Each card shows: label (Home/Work/Other), full address, delivery instructions
- Default address highlighted with badge
- Add new address button
- Edit and Delete actions on each card
- Set as default action
- Maximum 5 addresses per user

### Address Form Modal
- Label selector (Home, Work, Other with custom option)
- Street address input
- City, State, Postal Code fields
- Delivery instructions textarea
- "Set as default" toggle
- Save and Cancel buttons
- Form validation with inline error messages

## Favorites System (`app/account/favorites/page.js`)

### Features
- Grid of favorite menu items (same card as menu page)
- Heart icon toggle on menu cards (filled = favorited)
- Remove from favorites with confirmation
- "Add to Cart" directly from favorites page
- Empty state with "Browse Menu" CTA
- Sort by: Recently Added, Name, Price

### Toggle Favorite Logic
```js
const toggleFavorite = async (menuItemId) => {
  if (!user) {
    toast.error('Please sign in to save favorites');
    return;
  }

  const isFavorited = favorites.some(f => f.menu_item_id === menuItemId);

  if (isFavorited) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('menu_item_id', menuItemId);
    setFavorites(prev => prev.filter(f => f.menu_item_id !== menuItemId));
    toast.success('Removed from favorites');
  } else {
    const { data } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, menu_item_id: menuItemId })
      .select()
      .single();
    setFavorites(prev => [...prev, data]);
    toast.success('Added to favorites');
  }
};
```

### Heart Animation CSS
```css
.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  transition: transform var(--transition-fast);
}

.favorite-btn:active {
  transform: scale(0.85);
}

.favorite-btn--active svg {
  fill: hsl(0, 80%, 55%);
  color: hsl(0, 80%, 55%);
  animation: bounce var(--transition-bounce);
}
```

## Review System

### Write Review Form
Shown on order detail page for delivered orders:
- Star rating selector (1-5 stars, clickable or hoverable)
- Review text area (min 10 characters)
- Submit button
- One review per menu item per order

### Review Display
On menu item detail page:
- Average rating with star breakdown (5-star bar chart)
- Total review count
- Individual review cards: user avatar, name, date, rating, comment
- "Verified Purchase" badge for order-linked reviews
- Pagination for reviews

### Star Rating Component CSS
```css
.star-rating {
  display: flex;
  gap: 2px;
}

.star-rating__star {
  cursor: pointer;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.star-rating__star:hover {
  transform: scale(1.2);
}

.star-rating__star--filled {
  color: hsl(45, 90%, 50%);
}

.star-rating__star--empty {
  color: var(--color-border);
}
```

## User Settings (`app/account/settings/page.js`)

- Edit profile (name, phone, avatar upload)
- Change password
- Notification preferences (email, push)
- Order preferences (default order type, default address)
- Delete account (with confirmation modal)
- Sign out button
