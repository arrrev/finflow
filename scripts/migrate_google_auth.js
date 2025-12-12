
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
    // Add SSL config if needed for production, similar to potential Vercel/Neon requirements
    ssl: (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').includes('localhost')
        ? false
        : { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Make password_hash nullable in users table...');

        await client.query(`
            ALTER TABLE users 
            ALTER COLUMN password_hash DROP NOT NULL;
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
