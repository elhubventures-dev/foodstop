# Phase 8 — SEO, Performance & Polish

## Metadata & Open Graph

### Root Layout Metadata (`app/layout.js`)
```js
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Restaurant Name — Fresh Food Delivered',
    template: '%s | Restaurant Name',
  },
  description: 'Order delicious food online from Restaurant Name. Fresh ingredients, fast delivery, and an unforgettable dining experience.',
  keywords: ['restaurant', 'food delivery', 'order food online', 'takeaway', 'cuisine type'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Restaurant Name',
    images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: 'Restaurant Name' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@restauranthandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};
```

### Per-Page Metadata
Each page should export its own `generateMetadata`:
```js
// app/menu/[slug]/page.js
export async function generateMetadata({ params }) {
  const item = await getMenuItem(params.slug);
  return {
    title: item.name,
    description: `Order ${item.name} — ${item.description?.slice(0, 150)}`,
    openGraph: {
      images: [{ url: item.image_url, width: 800, height: 600, alt: item.name }],
    },
  };
}
```

## JSON-LD Structured Data

Add structured data for SEO enrichment:

### Restaurant Schema (homepage)
```js
const restaurantSchema = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Restaurant Name',
  image: 'https://example.com/images/restaurant.jpg',
  url: 'https://example.com',
  telephone: '+1234567890',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Main St',
    addressLocality: 'City',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
  servesCuisine: 'Italian',
  priceRange: '$$',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '10:00', closes: '22:00' },
    // ... other days
  ],
  menu: 'https://example.com/menu',
  acceptsReservations: 'True',
};
```

### Menu Item Schema (item pages)
```js
const menuItemSchema = {
  '@context': 'https://schema.org',
  '@type': 'MenuItem',
  name: item.name,
  description: item.description,
  image: item.image_url,
  offers: {
    '@type': 'Offer',
    price: item.price,
    priceCurrency: 'USD',
    availability: item.is_available
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
  },
  nutrition: item.calories ? {
    '@type': 'NutritionInformation',
    calories: `${item.calories} cal`,
  } : undefined,
};
```

Add to page with:
```jsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

## Sitemap (`app/sitemap.js`)
```js
export default async function sitemap() {
  const supabase = createClient();

  const { data: items } = await supabase
    .from('menu_items')
    .select('slug, updated_at')
    .eq('is_available', true);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, created_at');

  const staticPages = [
    { url: '/', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: '/menu', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: '/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: '/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const itemPages = items?.map(item => ({
    url: `/menu/${item.slug}`,
    lastModified: item.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  })) || [];

  return [...staticPages, ...itemPages];
}
```

## Robots.txt (`app/robots.js`)
```js
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/checkout', '/api'] },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
```

## Performance Optimization

### Image Optimization
- Use `next/image` for all images with `sizes` and `priority` props
- Serve WebP format via Next.js built-in optimization
- Lazy load below-fold images
- Use blur placeholder for large hero images:

```jsx
import Image from 'next/image';

<Image
  src={item.image_url}
  alt={item.name}
  width={400}
  height={300}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
/>
```

### Core Web Vitals
- **LCP**: Prioritize hero image loading with `priority` prop
- **CLS**: Set explicit `width` and `height` on images, use `aspect-ratio` CSS
- **FID/INP**: Minimize main thread work, use `useTransition` for non-urgent updates

### Bundle Optimization
- Dynamic imports for heavy components (modals, charts, admin pages)
- `next/dynamic` with `{ ssr: false }` for client-only components

```js
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/admin/RevenueChart'), {
  ssr: false,
  loading: () => <Skeleton height={300} />,
});
```

## UI Polish

### Toast Notifications
Use react-hot-toast with custom styling:
```js
import toast, { Toaster } from 'react-hot-toast';

// In layout:
<Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 'var(--space-3) var(--space-4)',
    },
    success: { iconTheme: { primary: 'var(--color-success)' } },
    error: { iconTheme: { primary: 'var(--color-error)' } },
    duration: 3000,
  }}
/>
```

### Loading Skeletons
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.skeleton--text { height: 1em; margin-bottom: var(--space-2); }
.skeleton--title { height: 1.5em; width: 60%; }
.skeleton--image { aspect-ratio: 4 / 3; }
.skeleton--card { border-radius: var(--radius-xl); min-height: 200px; }
```

### Error Boundaries
Create a `components/ErrorBoundary.js` (class component) and wrap major sections.

### 404 Page (`app/not-found.js`)
- Fun illustration (generate with `generate_image`)
- "Page not found" message
- "Back to Menu" and "Go Home" buttons
- Recent popular items suggestion

### Error Page (`app/error.js`)
- Client component with retry button
- Friendly error message
- Link to homepage

## Accessibility Checklist
- [ ] All images have descriptive `alt` text
- [ ] Form inputs have associated `<label>` elements
- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Focus indicators visible on all interactive elements
- [ ] `aria-label` on icon-only buttons
- [ ] Skip navigation link
- [ ] Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`
- [ ] `role` attributes where semantic HTML isn't possible
- [ ] Keyboard navigation works for all interactive elements
- [ ] Modal focus trapping
- [ ] Screen reader announcements for dynamic content (toast, cart updates)
