-- Audit Logging System
-- Tracks who did what, when, and from where

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- e.g., 'update_menu_item', 'delete_user', 'change_branch_config'
  entity_type TEXT NOT NULL, -- e.g., 'menu_items', 'profiles', 'orders'
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast searching by admin
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Sample usage in a trigger (simplified)
-- This would be added to critical tables like menu_items
CREATE OR REPLACE FUNCTION log_menu_item_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    auth.uid(), 
    TG_OP || '_MENU_ITEM', 
    'menu_items', 
    COALESCE(NEW.id, OLD.id), 
    to_jsonb(OLD), 
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
