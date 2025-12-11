-- 1. Add ID columns to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_id INTEGER,
ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- 2. Populate account_id
UPDATE transactions t
SET account_id = a.id
FROM accounts a
JOIN users u ON a.user_id = u.id
WHERE t.user_email = u.email AND t.account_name = a.name;

-- 3. Populate category_id
UPDATE transactions t
SET category_id = c.id
FROM categories c
JOIN users u ON c.user_id = u.id
WHERE t.user_email = u.email AND t.category_name = c.name;

-- 4. Add constraints to new ID columns
-- (Optional: Make them NOT NULL after verification, keeping nullable for now to avoid migration failure)
ALTER TABLE transactions 
ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id),
ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id);

-- 5. Drop old Foreign Keys referencing names
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_name_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_name_fkey;

-- 6. Add deleted_at to accounts and categories
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 7. Drop old global unique name constraints
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- 8. Add new partial unique indices (User Scoped + Not Deleted)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_name_idx ON accounts (user_id, name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_idx ON categories (user_id, name) WHERE deleted_at IS NULL;
