-- =====================================================
-- Migration: Change transactions from user_email to user_id
-- =====================================================
-- This migration:
-- 1. Adds user_id column to transactions
-- 2. Populates user_id from user_email
-- 3. Makes user_id NOT NULL
-- 4. Adds foreign key constraint
-- 5. Updates indexes
-- 6. Optionally drops user_email (commented out for safety)
-- =====================================================

-- Step 1: Add user_id column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Step 2: Populate user_id from user_email
UPDATE transactions t
SET user_id = u.id
FROM users u
WHERE t.user_email = u.email;

-- Step 3: Make user_id NOT NULL (after population)
ALTER TABLE transactions 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE transactions 
ADD CONSTRAINT transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 5: Drop old foreign key constraint on user_email
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_user_email_fkey;

-- Step 6: Update indexes (drop old, create new)
DROP INDEX IF EXISTS idx_transactions_user_email;
DROP INDEX IF EXISTS idx_transactions_user_account;
DROP INDEX IF EXISTS idx_transactions_user_date;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at);

-- Step 7: Drop accounts.balance column (no longer used - balances calculated on the fly)
ALTER TABLE accounts DROP COLUMN IF EXISTS balance;

-- Step 8: Drop user_email column (UNCOMMENT AFTER VERIFYING MIGRATION WORKS)
-- ALTER TABLE transactions DROP COLUMN IF EXISTS user_email;

-- =====================================================
-- Migration Complete
-- =====================================================
-- After verifying everything works, uncomment Step 8 to remove user_email column
-- =====================================================

