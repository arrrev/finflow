-- Add balance_amd to accounts
ALTER TABLE accounts
ADD COLUMN balance_amd NUMERIC(12,2) DEFAULT 0;
