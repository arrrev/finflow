-- 1. Add deleted_at column
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Drop old global unique name constraints
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- 3. Add new partial unique indices (User Scoped + Not Deleted)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_name_idx ON accounts (user_id, name) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_idx ON categories (user_id, name) WHERE deleted_at IS NULL;
