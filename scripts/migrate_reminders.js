const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
                if (key) { // Check only key, value can be empty string
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log('Could not load .env.local', e);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Add reminder_date to monthly_plans table...');

        // Add initial_balance column if not exists
        await client.query(`
      ALTER TABLE monthly_plans 
      ADD COLUMN IF NOT EXISTS reminder_date DATE;
    `);

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
