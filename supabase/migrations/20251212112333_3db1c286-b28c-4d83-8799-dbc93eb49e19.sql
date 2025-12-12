-- Phase 1: Add conversation_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);

-- Phase 2: Add wallet fields to profiles (for future wallet balance system)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xmr_subaddress TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xmr_balance DECIMAL(18,12) DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_conversation_id ON orders(conversation_id);

-- Allow orders to update conversation_id
-- (RLS already allows buyers/sellers to update their orders)