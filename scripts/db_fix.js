const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/finance_tracker';

const pool = new Pool({
    connectionString,
});

async function runMigrations() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected.');

        // 1. Add Default Account to Categories
        try {
            console.log('Running add_default_account_to_categories.sql...');
            const sql1 = fs.readFileSync(path.join(__dirname, 'add_default_account_to_categories.sql'), 'utf8');
            await client.query(sql1);
            console.log('Success: default_account_id added.');
        } catch (err) {
            if (err.code === '42701') { // duplicate_column
                console.log('Skipped: default_account_id already exists.');
            } else {
                console.error('Error running script 1:', err.message);
            }
        }

        // 2. Add Balance AMD to Accounts
        try {
            console.log('Running add_balance_amd_to_accounts.sql...');
            const sql2 = fs.readFileSync(path.join(__dirname, 'add_balance_amd_to_accounts.sql'), 'utf8');
            await client.query(sql2);
            console.log('Success: balance_amd added.');
        } catch (err) {
            if (err.code === '42701') { // duplicate_column
                console.log('Skipped: balance_amd already exists.');
            } else {
                console.error('Error running script 2:', err.message);
            }
        }

        client.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await pool.end();
    }
}

runMigrations();
