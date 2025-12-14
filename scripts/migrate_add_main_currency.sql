-- Migration: Add main_currency to users table
-- This migration adds the main_currency column to the users table
-- to support per-user default currency settings

-- Add main_currency column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS main_currency VARCHAR(3) DEFAULT 'USD';

-- Set default currency for existing users who don't have one set
-- (Optional: You can change 'USD' to 'AMD' if you prefer that as the default)
UPDATE users 
SET main_currency = 'USD' 
WHERE main_currency IS NULL;

-- Add comment to column for documentation
COMMENT ON COLUMN users.main_currency IS 'User''s default/main currency for dashboard summaries (ISO 4217 code, e.g., USD, EUR, AMD)';
