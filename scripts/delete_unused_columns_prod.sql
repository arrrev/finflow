-- =====================================================
-- Delete Unused Columns - Production Migration
-- =====================================================
-- This script removes columns that are no longer used in the application
-- Run this AFTER ensuring the application code no longer references these columns
-- =====================================================

-- =====================================================
-- 1. Delete unused columns from transactions table
-- =====================================================
-- These columns were replaced by foreign key relationships (category_id, account_id)

ALTER TABLE transactions 
DROP COLUMN IF EXISTS category_name;

ALTER TABLE transactions 
DROP COLUMN IF EXISTS account_name;

-- =====================================================
-- 2. Delete unused columns from accounts table
-- =====================================================
-- balance_amd was replaced by balance (which stores balance in account currency)

ALTER TABLE accounts 
DROP COLUMN IF EXISTS balance_amd;

-- =====================================================
-- 3. Delete ordering columns
-- =====================================================
-- These columns were never used for sorting or display

ALTER TABLE categories 
DROP COLUMN IF EXISTS ordering;

ALTER TABLE accounts 
DROP COLUMN IF EXISTS ordering;

ALTER TABLE subcategories 
DROP COLUMN IF EXISTS ordering;

-- =====================================================
-- 4. Delete deleted_at columns (soft delete columns)
-- =====================================================
-- The application now uses hard deletes, so these columns are not needed

ALTER TABLE categories 
DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE accounts 
DROP COLUMN IF EXISTS deleted_at;

-- =====================================================
-- 5. Delete original_amount and original_currency from transactions
-- =====================================================
-- These columns were removed as transactions are now stored in account currency
-- and conversion to user's main currency is done on-the-fly using exchange_rate

ALTER TABLE transactions 
DROP COLUMN IF EXISTS original_amount;

ALTER TABLE transactions 
DROP COLUMN IF EXISTS original_currency;

-- =====================================================
-- Migration Complete
-- =====================================================
-- All unused columns have been removed
-- =====================================================

