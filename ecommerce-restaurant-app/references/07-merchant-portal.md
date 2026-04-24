-- Merchant Portal Support
ALTER TABLE profiles ADD COLUMN managed_branch_id UUID REFERENCES branches(id);
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'staff', 'manager'));
