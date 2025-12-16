-- =====================================================
-- Migration Script for Finance Tracker v2
-- =====================================================
-- This script includes all database changes required for the new version:
-- 1. Add balance column to accounts table
-- 2. Add exchange_rate column to transactions table
-- 3. Add performance indexes
-- =====================================================

-- =====================================================
-- 1. Add balance column to accounts table
-- =====================================================
-- This stores the current balance in the account's currency for fast retrieval
-- Balance = initial_balance + sum of all transactions for that account

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;

COMMENT ON COLUMN accounts.balance IS 'Current balance in account currency (initial_balance + sum of transactions). Updated automatically on transaction create/edit/delete.';

-- =====================================================
-- 2. Add exchange_rate column to transactions table
-- =====================================================
-- This stores exchange rates at the time of transaction creation
-- Format: JSON object with currency rates relative to USD
-- Example: {"USD": 1, "AMD": 400, "EUR": 0.92}

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS exchange_rate JSONB;

COMMENT ON COLUMN transactions.exchange_rate IS 'Exchange rates at transaction creation time (JSON object with currency codes as keys and rates relative to USD as values)';

-- =====================================================
-- 3. Add performance indexes
-- =====================================================
-- These indexes significantly speed up common query patterns

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_email, account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_email, created_at);

-- Monthly plans indexes
CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_id ON monthly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month ON monthly_plans(month);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_month ON monthly_plans(user_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_category_id ON monthly_plans(category_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

-- =====================================================
-- 4. Calculate initial balances for existing accounts
-- =====================================================
-- This calculates and sets balance = initial_balance + sum of transactions
-- for all existing accounts

UPDATE accounts a
SET balance = COALESCE(a.initial_balance, 0) + COALESCE(
    (SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0
);

-- =====================================================
-- Migration Complete
-- =====================================================
-- After running this migration, you should run:
-- node scripts/recalculate_account_balances.js
-- to ensure all balances are correctly calculated
-- =====================================================

