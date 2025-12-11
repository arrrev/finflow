const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Usage: DATABASE_URL="postgresql://user:pass@host:port/dbname" node scripts/deploy_migrations.js

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    console.log("Usage: DATABASE_URL='postgresql://...' node scripts/deploy_migrations.js");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } // Assume SSL for prod (e.g. Neon, Supabase, Heroku), unless localhost
});

(async () => {
    try {
        console.log("Connecting to database...");
        const client = await pool.connect();
        console.log("Connected.");

        try {
            console.log("Running migration: production_migration_v1.sql");
            const sql = fs.readFileSync(path.join(__dirname, 'production_migration_v1.sql'), 'utf8');
            await client.query(sql);
            console.log("Migration executed successfully.");
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Migration Failed:", e);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
