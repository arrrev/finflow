#!/usr/bin/env node
/**
 * Database Truncate Script
 * ⚠️ WARNING: This will DELETE ALL DATA from the database!
 * Run with: node scripts/truncate-db.js
 */

const { Pool } = require('pg');

async function truncateDatabase() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable not set!');
        console.log('💡 Make sure your .env.local file is loaded');
        process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();

        console.log('⚠️  WARNING: About to DELETE ALL DATA!');
        console.log('⏳ Starting in 3 seconds... (Ctrl+C to cancel)');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('🗑️  Truncating tables...');

        // Truncate all tables
        await client.query('TRUNCATE TABLE monthly_plans CASCADE');
        console.log('  ✓ monthly_plans');

        await client.query('TRUNCATE TABLE transactions CASCADE');
        console.log('  ✓ transactions');

        await client.query('TRUNCATE TABLE subcategories CASCADE');
        console.log('  ✓ subcategories');

        await client.query('TRUNCATE TABLE categories CASCADE');
        console.log('  ✓ categories');

        await client.query('TRUNCATE TABLE accounts CASCADE');
        console.log('  ✓ accounts');

        await client.query('TRUNCATE TABLE users CASCADE');
        console.log('  ✓ users');

        console.log('\n🔄 Resetting sequences...');

        // Reset sequences
        await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE subcategories_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE accounts_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE transactions_id_seq RESTART WITH 1');
        await client.query('ALTER SEQUENCE monthly_plans_id_seq RESTART WITH 1');
        console.log('  ✓ All sequences reset to 1');

        // Verify
        console.log('\n📊 Verifying...');
        const result = await client.query(`
            SELECT 'users' as table_name, COUNT(*) as count FROM users
            UNION ALL SELECT 'categories', COUNT(*) FROM categories
            UNION ALL SELECT 'subcategories', COUNT(*) FROM subcategories
            UNION ALL SELECT 'accounts', COUNT(*) FROM accounts
            UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
            UNION ALL SELECT 'monthly_plans', COUNT(*) FROM monthly_plans
        `);

        console.table(result.rows);

        client.release();
        console.log('\n✅ Database truncated successfully!');
        console.log('💡 Next steps:');
        console.log('   1. Go to http://localhost:3000/register');
        console.log('   2. Create a new account');
        console.log('   3. Set up categories and accounts\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

truncateDatabase();
