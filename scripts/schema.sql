-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (User specific or Global if user_id is null)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  color VARCHAR(20) DEFAULT '#fbbf24', -- Default yellow
  ordering INTEGER DEFAULT 0,
  UNIQUE(name, user_id) 
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  ordering INTEGER DEFAULT 0
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  color VARCHAR(20) DEFAULT '#fbbf24',
  default_currency VARCHAR(3) DEFAULT 'AMD',
  ordering INTEGER DEFAULT 0,
  UNIQUE(name, user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) REFERENCES users(email),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'AMD',
  
  -- Original amount/currency (if converted)
  original_amount DECIMAL(12, 2),
  original_currency VARCHAR(3),

  category_name VARCHAR(50), -- Keeping for legacy/ease, but should ideally migrate to FK
  account_name VARCHAR(50),  -- Keeping for legacy/ease
  
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Plans
CREATE TABLE IF NOT EXISTS monthly_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  month VARCHAR(7) NOT NULL, -- "YYYY-MM"
  category_id INTEGER REFERENCES categories(id),
  subcategory_id INTEGER REFERENCES subcategories(id),
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
