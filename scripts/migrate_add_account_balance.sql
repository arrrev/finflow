-- Migration: Add balance column to accounts table and calculate initial balances
-- This stores the current balance in the account's currency for fast retrieval

-- Add balance column
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;

-- Calculate and set balance for all existing accounts
-- Balance = initial_balance + sum of all transactions for that account
UPDATE accounts a
SET balance = COALESCE(
    (SELECT initial_balance FROM accounts WHERE id = a.id), 0
) + COALESCE(
    (SELECT SUM(amount) FROM transactions WHERE account_id = a.id), 0
);

-- Add comment for documentation
COMMENT ON COLUMN accounts.balance IS 'Current balance in account currency (initial_balance + sum of transactions). Updated automatically on transaction create/edit/delete.';

