-- Migration: Add exchange_rate to transactions table
-- This stores the exchange rate at the time of transaction creation
-- Format: JSON object with currency rates relative to USD
-- Example: {"USD": 1, "AMD": 400, "EUR": 0.92}

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS exchange_rate JSONB;

-- Add comment for documentation
COMMENT ON COLUMN transactions.exchange_rate IS 'Exchange rates at transaction creation time (JSON object with currency codes as keys and rates relative to USD as values)';

