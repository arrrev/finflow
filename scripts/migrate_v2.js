const { Pool } = require('pg');
// require('dotenv').config({ path: '../.env' }); 

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'finance_tracker',
});

async function migrate() {
    try {
        console.log('Running V2 Migration...');

        // 1. Categories
        console.log('- Altering categories...');
        await pool.query(`
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#fbbf24',
            ADD COLUMN IF NOT EXISTS ordering INTEGER DEFAULT 0;
        `);
        // Drop unique constraint on name if it exists globally, ideally we want unique(name, user_id)
        // But doing that on existing data is tricky if duplicates exist. Skipping constraint mod for now.

        // 2. Accounts
        console.log('- Altering accounts...');
        await pool.query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#fbbf24',
            ADD COLUMN IF NOT EXISTS default_currency VARCHAR(3) DEFAULT 'AMD',
            ADD COLUMN IF NOT EXISTS ordering INTEGER DEFAULT 0;
        `);

        // 3. Transactions
        console.log('- Altering transactions...');
        await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12, 2),
            ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3);
        `);

        // 4. Create New Tables
        console.log('- Creating subcategories...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subcategories (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                ordering INTEGER DEFAULT 0
            );
        `);

        console.log('- Creating monthly_plans...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS monthly_plans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                month VARCHAR(7) NOT NULL,
                category_id INTEGER REFERENCES categories(id),
                subcategory_id INTEGER REFERENCES subcategories(id),
                amount DECIMAL(12, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('V2 Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
