-- Add default_account_id to categories
ALTER TABLE categories
ADD COLUMN default_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;
