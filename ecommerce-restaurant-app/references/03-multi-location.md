-- Branches Table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link Menu Items to Branches (Availability)
CREATE TABLE branch_menu_availability (
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (branch_id, menu_item_id)
);

-- Update Orders to track which branch fulfilled it
ALTER TABLE orders ADD COLUMN branch_id UUID REFERENCES branches(id);
