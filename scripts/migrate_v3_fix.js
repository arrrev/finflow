const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'finance_tracker',
});

async function migrate() {
    try {
        console.log('Running V3 Fix Migration...');

        await pool.query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES subcategories(id);
        `);

        console.log('V3 Fix successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
