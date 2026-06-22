-- Add the expected flag to the transactions table.
-- Use this statement in Supabase SQL editor or your database migration flow.

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS expected BOOLEAN NOT NULL DEFAULT TRUE;
