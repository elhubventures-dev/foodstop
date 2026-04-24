# Phase 1 — Project Scaffold & Design System

## Step 1: Initialize the Project

```bash
npx -y create-next-app@latest ./ --js --app --eslint --no-tailwind --src-dir=false --import-alias="@/*" --no-turbopack
```

Install additional dependencies:
```bash
npm install @supabase/supabase-js @supabase/ssr react-paystack react-hot-toast lucide-react
```

## Step 2: Directory Structure

Create the full directory tree as outlined in the SKILL.md file structure section. Use `mkdir -p` or create directories programmatically.

## Step 3: Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_RESTAURANT_NAME=Restaurant Name
```

## Step 4: CSS Design System

Create `app/globals.css` with these design tokens. This is the foundation — every component pulls from here.

### Color Palette (HSL-based for easy theming)

```css
:root {
  /* Brand Colors — Warm restaurant palette */
  --color-primary-h: 25;
  --color-primary-s: 85%;
  --color-primary-l: 55%;
  --color-primary: hsl(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l));
  --color-primary-light: hsl(var(--color-primary-h), var(--color-primary-s), 70%);
  --color-primary-dark: hsl(var(--color-primary-h), var(--color-primary-s), 40%);

  --color-secondary-h: 145;
  --color-secondary-s: 45%;
  --color-secondary-l: 42%;
  --color-secondary: hsl(var(--color-secondary-h), var(--color-secondary-s), var(--color-secondary-l));

  --color-accent-h: 45;
  --color-accent-s: 90%;
  --color-accent-l: 55%;
  --color-accent: hsl(var(--color-accent-h), var(--color-accent-s), var(--color-accent-l));

  /* Neutrals */
  --color-bg: hsl(30, 20%, 98%);
  --color-bg-secondary: hsl(30, 15%, 95%);
  --color-bg-tertiary: hsl(30, 10%, 90%);
  --color-surface: hsl(0, 0%, 100%);
  --color-surface-elevated: hsl(0, 0%, 100%);
  --color-text-primary: hsl(20, 20%, 15%);
  --color-text-secondary: hsl(20, 10%, 40%);
  --color-text-muted: hsl(20, 8%, 60%);
  --color-border: hsl(30, 10%, 88%);
  --color-border-light: hsl(30, 10%, 93%);

  /* Semantic */
  --color-success: hsl(145, 60%, 42%);
  --color-warning: hsl(38, 90%, 50%);
  --color-error: hsl(0, 72%, 51%);
  --color-info: hsl(210, 80%, 55%);

  /* Typography */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
  --text-lg: clamp(1.05rem, 1rem + 0.25vw, 1.125rem);
  --text-xl: clamp(1.15rem, 1.05rem + 0.5vw, 1.25rem);
  --text-2xl: clamp(1.4rem, 1.2rem + 1vw, 1.5rem);
  --text-3xl: clamp(1.7rem, 1.4rem + 1.5vw, 1.875rem);
  --text-4xl: clamp(2rem, 1.5rem + 2.5vw, 2.25rem);
  --text-5xl: clamp(2.5rem, 1.8rem + 3.5vw, 3rem);

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px hsla(0, 0%, 0%, 0.05);
  --shadow-md: 0 4px 6px -1px hsla(0, 0%, 0%, 0.07), 0 2px 4px -2px hsla(0, 0%, 0%, 0.05);
  --shadow-lg: 0 10px 15px -3px hsla(0, 0%, 0%, 0.08), 0 4px 6px -4px hsla(0, 0%, 0%, 0.04);
  --shadow-xl: 0 20px 25px -5px hsla(0, 0%, 0%, 0.1), 0 8px 10px -6px hsla(0, 0%, 0%, 0.05);
  --shadow-glow: 0 0 20px hsla(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.25);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Z-index layers */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;

  /* Layout */
  --header-height: 72px;
  --mobile-nav-height: 64px;
  --sidebar-width: 260px;
  --container-max: 1200px;
  --container-narrow: 800px;
}

/* Dark mode overrides */
[data-theme="dark"] {
  --color-bg: hsl(20, 15%, 10%);
  --color-bg-secondary: hsl(20, 12%, 14%);
  --color-bg-tertiary: hsl(20, 10%, 18%);
  --color-surface: hsl(20, 12%, 13%);
  --color-surface-elevated: hsl(20, 12%, 16%);
  --color-text-primary: hsl(30, 15%, 92%);
  --color-text-secondary: hsl(30, 10%, 70%);
  --color-text-muted: hsl(20, 8%, 50%);
  --color-border: hsl(20, 10%, 22%);
  --color-border-light: hsl(20, 10%, 18%);
}
```

### Base Styles & Resets

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
}

input, textarea, select {
  font: inherit;
  color: inherit;
}
```

### Utility Classes

```css
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-narrow {
  max-width: var(--container-narrow);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

### Animation Keyframes

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slideInLeft {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Step 5: Layout Components

### Root Layout (`app/layout.js`)

- Import Google Fonts (Playfair Display + Inter) via `next/font/google`
- Wrap children with `AuthProvider`, `CartProvider`, `ThemeProvider`
- Include `Header` and `Footer` components
- Add `<Toaster />` from react-hot-toast
- Set metadata: title template, description, Open Graph

### Header Component

Must include:
- Restaurant logo (left)
- Desktop navigation links (Menu, About, Contact)
- Search bar (expandable on click)
- Theme toggle (sun/moon icon)
- Cart icon with item count badge (animated bounce on change)
- User avatar dropdown (login/signup if not authenticated)
- Mobile hamburger menu button
- Sticky positioning with backdrop blur on scroll

### Footer Component

Must include:
- Restaurant branding and short description
- Quick links (Menu, About, Privacy, Terms)
- Contact info (address, phone, email)
- Social media icons
- Newsletter signup form
- Operating hours
- "Made with ❤️" attribution
- Responsive grid layout (4 cols desktop → stacked mobile)

### Mobile Bottom Navigation

Fixed bottom bar with 4-5 icons for mobile:
- Home, Menu, Cart (with count badge), Account, Search
- Active state indicator (animated pill underline)
- 64px height, safe-area padding for notched devices

## Step 6: Google Fonts

```js
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
```

Apply both font variables to the `<html>` or `<body>` element.

## Responsive Breakpoints

Use these consistently:
```css
/* Mobile first — no media query needed for base styles */

/* Tablet */
@media (min-width: 640px) { }

/* Small desktop */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large desktop */
@media (min-width: 1280px) { }
```
