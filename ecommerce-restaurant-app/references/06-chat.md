-- Chat/Messages Table
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT CHECK (sender_role IN ('customer', 'staff', 'admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time should be enabled for this table
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
