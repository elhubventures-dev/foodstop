-- Rider Auto-Assignment Logic
-- This would typically be a Supabase Edge Function or Database Trigger

CREATE OR REPLACE FUNCTION assign_rider_to_ready_order()
RETURNS TRIGGER AS $$
DECLARE
  closest_rider_id UUID;
BEGIN
  -- 1. Find the closest online rider (simplified logic for now)
  -- In a real app: JOIN with rider_locations and use PostGIS ST_Distance
  SELECT id INTO closest_rider_id
  FROM profiles
  WHERE role = 'rider' 
    AND status = 'online'
  LIMIT 1; -- Should be ordered by distance

  -- 2. If a rider is found, assign them
  IF closest_rider_id IS NOT NULL THEN
    UPDATE orders 
    SET 
      rider_id = closest_rider_id,
      status = 'rider_assigned',
      assigned_at = NOW()
    WHERE id = NEW.id;
    
    -- 3. Notify the rider (Mocked for this logic)
    -- In a real app: Call Push Notification service
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_ready_assign
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'ready')
  EXECUTE FUNCTION assign_rider_to_ready_order();
