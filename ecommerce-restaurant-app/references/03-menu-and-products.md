# Phase 3 — Menu & Product System

## Menu Page (`app/menu/page.js`)

### Layout
- Full-width hero banner with restaurant imagery
- Sticky category filter bar (horizontal scrollable pills)
- Grid of menu item cards: 1 col on mobile, 2 on tablet, 3-4 on desktop
- Search bar at top with live filtering (debounce 300ms)
- Dietary filter toggles (Vegetarian, Vegan, Gluten-Free, Spicy, Halal)
- Sort dropdown (Popular, Price Low-High, Price High-Low, Newest)

### Data Fetching
```js
// Fetch categories and items server-side
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('display_order');

const { data: items } = await supabase
  .from('menu_items')
  .select('*, categories(name, slug)')
  .eq('is_available', true)
  .order('display_order');
```

## Menu Item Card Component (`components/menu/MenuCard.js`)

Each card needs:
- **Image**: Aspect ratio 4:3, border-radius, lazy loading with `next/image`, skeleton placeholder
- **Category badge**: Small tag in top-left corner
- **Name**: Bold, truncated to 2 lines
- **Description**: Muted text, truncated to 2 lines with ellipsis
- **Price**: Prominent, and if `compare_price` exists show strikethrough original
- **Dietary tags**: Small colored pills (green for veg, red for spicy, etc.)
- **Rating**: Stars display with average rating and review count
- **Add to Cart button**: Primary color, icon + text, hover animation
- **Hover effect**: Slight scale(1.02) transform + elevated shadow
- **New/Featured badge**: Animated ribbon in top-right if applicable

### Card CSS
```css
.menu-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  cursor: pointer;
  position: relative;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.menu-card__image-wrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.menu-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.menu-card:hover .menu-card__image {
  transform: scale(1.05);
}

.menu-card__body {
  padding: var(--space-4);
}

.menu-card__price {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.menu-card__compare-price {
  text-decoration: line-through;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin-left: var(--space-2);
}

.menu-card__tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-top: var(--space-2);
}

.dietary-tag {
  font-size: var(--text-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 500;
}

.dietary-tag--vegetarian { background: hsl(120, 40%, 90%); color: hsl(120, 50%, 30%); }
.dietary-tag--vegan { background: hsl(145, 40%, 90%); color: hsl(145, 50%, 25%); }
.dietary-tag--spicy { background: hsl(0, 60%, 92%); color: hsl(0, 60%, 40%); }
.dietary-tag--gluten-free { background: hsl(45, 50%, 90%); color: hsl(45, 60%, 30%); }
.dietary-tag--halal { background: hsl(210, 40%, 92%); color: hsl(210, 50%, 35%); }
```

## Category Filter Bar (`components/menu/CategoryFilter.js`)

- Horizontally scrollable on mobile (hide scrollbar with CSS)
- "All" option + each active category
- Active state: filled primary color background
- Smooth scroll behavior
- Sticky below header on scroll

```css
.category-filter {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding: var(--space-3) 0;
  position: sticky;
  top: var(--header-height);
  z-index: var(--z-sticky);
  background: var(--color-bg);
}

.category-filter::-webkit-scrollbar { display: none; }

.category-pill {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border-light);
}

.category-pill:hover {
  background: var(--color-bg-tertiary);
}

.category-pill--active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
```

## Item Detail Page (`app/menu/[slug]/page.js`)

Can also be implemented as a modal overlay. Includes:

- Large hero image (or image gallery carousel)
- Item name (display font, large)
- Description (full, not truncated)
- Price with any active discounts
- Dietary info + allergens section
- Nutritional info (calories, prep time)
- Spice level indicator (🌶️ icons)
- **Modifier groups**: render each group as a section
  - Radio buttons for single-select groups (e.g., Size)
  - Checkboxes for multi-select groups (e.g., Toppings)
  - Show price adjustments inline (+$1.50)
  - Validate required groups before add-to-cart
- Quantity selector (+/- buttons)
- Special instructions textarea
- "Add to Cart" button with dynamic price total
- Customer reviews section with rating breakdown
- "You may also like" carousel of related items

### Modifier Selection Logic
```js
const [selectedModifiers, setSelectedModifiers] = useState({});

const calculateTotal = () => {
  let total = item.price;
  Object.values(selectedModifiers).flat().forEach(mod => {
    total += mod.price_adjustment;
  });
  return total * quantity;
};
```

## Search Component (`components/shared/SearchBar.js`)

- Expandable search input (icon only → full input on click)
- Debounced query (300ms) to avoid excessive filtering
- Search through item names, descriptions, and tags
- Highlight matching text in results
- "No results" empty state with illustration
- Recent searches (localStorage)
- Keyboard shortcut: Ctrl+K to focus

## Featured Section (Homepage)

- "Today's Specials" or "Chef's Picks" section on homepage
- Horizontally scrollable card carousel
- Query: `menu_items` where `is_featured = true`
- Auto-rotate with dots indicator (optional)

## Image Strategy

For every menu item, use the `generate_image` tool to create appetizing food photography:
- Prompt should include the food item name, style ("professional food photography, soft lighting, shallow depth of field, on a rustic plate, warm tones")
- Generate at least a hero image for each category
- Generate individual item images for featured items
- All images should be saved to `public/images/menu/`
