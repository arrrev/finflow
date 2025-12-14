-- ============================================
-- Complete Migration Script for Finance Tracker
-- ============================================
-- Run this script to apply all necessary database migrations
-- Make sure to backup your database before running migrations!

-- ============================================
-- 1. Add main_currency to users table
-- ============================================
-- This allows each user to set their own default currency
-- for dashboard summaries and currency conversions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS main_currency VARCHAR(3) DEFAULT 'USD';

-- Set default currency for existing users
UPDATE users 
SET main_currency = 'USD' 
WHERE main_currency IS NULL;

COMMENT ON COLUMN users.main_currency IS 'User''s default/main currency for dashboard summaries (ISO 4217 code, e.g., USD, EUR, AMD)';

-- ============================================
-- 2. Add initial_balance to accounts table
-- ============================================
-- This stores the initial balance of each account in its native currency

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15, 2) DEFAULT 0;

COMMENT ON COLUMN accounts.initial_balance IS 'Initial balance of the account in its default_currency';

-- ============================================
-- 3. Add is_available to accounts table
-- ============================================
-- This allows accounts to be marked as available/unavailable
-- without deleting them

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- Update existing accounts to be available by default
UPDATE accounts 
SET is_available = true 
WHERE is_available IS NULL;

COMMENT ON COLUMN accounts.is_available IS 'Whether the account is currently available for transactions';

-- ============================================
-- Migration Complete
-- ============================================
-- Verify the changes:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND column_name = 'main_currency';
-- 
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'accounts' 
-- AND column_name IN ('initial_balance', 'is_available');
