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
                if (key) {
                    process.env[key] = value;
                }
            }
        });
    }
} catch (e) {
    console.log('Could not load .env.local', e);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    // Fix: explicitly disable SSL for localhost if needed, or rely on connection string params
    // If running locally without SSL, this object should effectively be empty or ssl: false
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Create email_otps and update users...');

        // 1. Create email_otps table
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                type VARCHAR(20) NOT NULL, -- 'REGISTER', 'RESET', 'PROFILE'
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add index on email for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
        `);

        // 2. Add email_verified to users
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
        `);

        // Mark existing users as verified to avoid locking them out
        await client.query(`
            UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
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
