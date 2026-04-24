-- setup_database.sql
-- Run these SQL statements in your Supabase SQL editor

-- 1. Users Profile Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Menu Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2),  -- For showing discounts
  image_url TEXT,
  images TEXT[],                  -- Multiple images array
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  dietary_tags TEXT[],           -- 'vegetarian', 'vegan', 'gluten-free', 'spicy', 'halal'
  allergens TEXT[],
  preparation_time INTEGER,      -- Minutes
  calories INTEGER,
  spice_level INTEGER DEFAULT 0, -- 0-5
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Item Modifiers / Customisations
CREATE TABLE IF NOT EXISTS modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- e.g., 'Size', 'Toppings', 'Sauce'
  required BOOLEAN DEFAULT FALSE,
  min_selections INTEGER DEFAULT 0,
  max_selections INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,              -- e.g., 'Large', 'Extra Cheese'
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

-- 5. Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',       -- Home, Work, Other
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'NG',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  instructions TEXT,               -- Delivery instructions
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled', 'refunded'
  )),
  type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'pickup', 'dine_in')),
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  delivery_address JSONB,          -- Snapshot of address at time of order
  special_instructions TEXT,
  estimated_delivery TIMESTAMPTZ,
  paystack_reference TEXT,
  payment_channel TEXT,              -- card, bank, ussd, mobile_money
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  name TEXT NOT NULL,                -- Snapshot of item name
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  modifiers JSONB,                  -- Snapshot of selected modifiers
  special_instructions TEXT,
  subtotal DECIMAL(10,2) NOT NULL
);

-- 7. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, menu_item_id, order_id)
);

-- 8. Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, menu_item_id)
);

-- 10. Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO store_settings (key, value) VALUES
  ('operating_hours', '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "11:00", "close": "23:00"}, "sunday": {"open": "11:00", "close": "21:00"}}')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES
  ('delivery_settings', '{"base_fee": 1500, "free_delivery_threshold": 20000, "max_radius_km": 15, "estimated_time_minutes": 45}')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES
  ('tax_rate', '{"rate": 0.075}') -- Standard VAT in Nigeria
  ON CONFLICT (key) DO NOTHING;
INSERT INTO store_settings (key, value) VALUES
  ('store_info', '{"name": "FOOD STOP", "phone": "+2349133449270", "email": "hello@foodstop.com.ng", "address": "12 Wuse 2 Road, Abuja"}')
  ON CONFLICT (key) DO NOTHING;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 11. Public read access policies
DROP POLICY IF EXISTS "Public categories read" ON categories;
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public menu read" ON menu_items;
CREATE POLICY "Public menu read" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public reviews read" ON reviews;
CREATE POLICY "Public reviews read" ON reviews FOR SELECT USING (true);

-- 12. User policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users view own orders" ON orders;
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create orders" ON orders;
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own addresses" ON addresses;
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own reviews" ON reviews;
CREATE POLICY "Users manage own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage favorites" ON favorites;
CREATE POLICY "Users manage favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- 13. Admin functions and policies
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'staff')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (is_admin());

-- Admin policies for menu_items
DROP POLICY IF EXISTS "Admins can manage menu items" ON menu_items;
CREATE POLICY "Admins can manage menu items" ON menu_items
  FOR ALL USING (is_admin());

-- Admin policies for orders
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin());

-- 14. Seed Data for Categories
INSERT INTO categories (id, name, slug, description, image_url, display_order) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Rice Dishes', 'rice', 'Authentic Nigerian rice specialties including Jollof and Fried rice.', '/images/menu/jollof-rice-party.png', 1),
  ('10000000-0000-0000-0000-000000000002', 'Swallows & Soups', 'swallow', 'Traditional Nigerian swallows paired with rich, authentic soups.', '/images/menu/egusi-pounded-yam.png', 2),
  ('10000000-0000-0000-0000-000000000003', 'Grills & BBQ', 'grill', 'Smoky, spicy grilled meats and traditional pepper soups.', '/images/menu/pepper-soup.jpg', 3),
  ('10000000-0000-0000-0000-000000000004', 'Snacks & Small Chops', 'snacks', 'Perfect quick bites and party favorites.', '/images/brand/hero-bg.jpg', 4),
  ('10000000-0000-0000-0000-000000000005', 'Cold Drinks', 'drinks', 'Refreshing traditional and modern Nigerian beverages.', '/images/brand/hero-bg.jpg', 5)
ON CONFLICT (id) DO NOTHING;

-- 15. Seed Data for Menu Items
INSERT INTO menu_items (id, category_id, name, slug, description, price, image_url, is_featured, is_available, dietary_tags, preparation_time, spice_level, display_order) VALUES
  ('20000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'Party Jollof Rice (Classic)', 'party-jollof-rice', 'Our award-winning smoky party jollof rice, slow-cooked over firewood for that authentic, charcoal-infused aroma. Served with perfectly caramelized fried plantains, a portion of creamy coleslaw, and grilled chicken.', 3500, '/images/menu/jollof-rice-party.png', TRUE, TRUE, ARRAY['spicy', 'popular', 'featured'], 25, 3, 1),
  ('20000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', 'Exotic Fried Rice & Grilled Chicken', 'fried-rice-chicken', 'Fluffy Nigerian-style fried rice tossed with sweet corn, carrots, green peas, and diced liver. Served with a juicy quarter grilled chicken.', 4000, '/images/menu/jollof-rice-party.png', FALSE, TRUE, ARRAY['popular'], 30, 1, 2),
  ('20000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'Creamy Coconut Rice & Fried Croaker', 'coconut-rice-fried-fish', 'Aromatic rice infused with fresh coconut milk, garlic, and ginger. Served with a whole large fried Croaker fish.', 4500, '/images/menu/jollof-rice-party.png', FALSE, TRUE, ARRAY['seafood'], 35, 1, 3),
  ('20000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000002', 'Pounded Yam & Special Egusi', 'pounded-yam-egusi', 'Smooth, stretchy pounded yam paired with our rich Lumpy Egusi soup. Features assorted meat, stockfish, and dried fish.', 4200, '/images/menu/egusi-pounded-yam.png', TRUE, TRUE, ARRAY['popular', 'featured'], 30, 2, 4),
  ('20000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000002', 'Amala, Ewedu & Gbegiri (Lagos Special)', 'amala-ewedu-gbegiri', 'Authentic dark yam flour (Amala) served with silky Ewedu leaf soup and creamy Gbegiri (bean soup), topped with spicy pepper stew and assorted meat.', 3800, '/images/menu/egusi-pounded-yam.png', FALSE, TRUE, ARRAY['popular', 'traditional'], 20, 3, 5),
  ('20000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000003', 'Point-and-Kill Catfish Pepper Soup', 'catfish-pepper-soup', 'Fiery and aromatic catfish pepper soup prepared with fresh whole catfish. Simmered with Ehuru, Uziza, and Scent leaves.', 5500, '/images/menu/pepper-soup.jpg', FALSE, TRUE, ARRAY['spicy', 'seafood'], 35, 4, 6),
  ('20000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000003', 'Beef Suya Platter', 'suya-beef-skewers', 'The definitive Nigerian street food. Thinly sliced beef marinated in spicy Yaji and smoked over open coals. Served with extra yaji and onions.', 3000, '/images/brand/hero-bg.jpg', FALSE, TRUE, ARRAY['spicy', 'popular'], 15, 3, 7),
  ('20000000-0000-0000-0000-000000000108', '10000000-0000-0000-0000-000000000004', 'Executive Small Chops Platter', 'small-chops-platter', 'A selection of party favorites: 4 Puff-Puff, 2 Samosas, 2 Spring Rolls, and 2 pieces of spicy gizzard.', 2500, '/images/brand/hero-bg.jpg', FALSE, TRUE, ARRAY['popular', 'snack'], 15, 2, 8),
  ('20000000-0000-0000-0000-000000000109', '10000000-0000-0000-0000-000000000005', 'Signature Lagos Chapman', 'chapman', 'Our signature mocktail. A refreshing blend of Fanta, Sprite, Ribena, and Angostura bitters. Garnished fresh.', 2500, '/images/brand/hero-bg.jpg', FALSE, TRUE, ARRAY['refreshing', 'non-alcoholic'], 5, 0, 9)
ON CONFLICT (id) DO NOTHING;
