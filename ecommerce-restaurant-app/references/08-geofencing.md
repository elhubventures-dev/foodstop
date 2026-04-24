-- Delivery Zones & Geo-Fencing
CREATE TABLE delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  geojson JSONB NOT NULL, -- Polygon data for the zone
  base_fee DECIMAL(12,2) DEFAULT 500,
  surge_multiplier DECIMAL(3,2) DEFAULT 1.0, -- e.g., 1.5 for peak times
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample zones for Nigeria (Lagos context)
INSERT INTO delivery_zones (name, base_fee, surge_multiplier, geojson) VALUES 
('Ikeja Central', 500, 1.0, '{"type": "Polygon", "coordinates": [...]}'),
('Lekki Phase 1', 1500, 1.2, '{"type": "Polygon", "coordinates": [...]}'),
('Victoria Island', 1200, 1.0, '{"type": "Polygon", "coordinates": [...]}');
