-- Performance indexes for faster queries
-- These indexes will significantly speed up common query patterns

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
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_name ON accounts(user_id, name);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);

