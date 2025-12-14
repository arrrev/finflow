#!/usr/bin/env node

/**
 * Script to migrate data from production to local database
 * 
 * Usage:
 * 1. Set PROD_DATABASE_URL in your .env.local file (production database connection string)
 * 2. Set DATABASE_URL in your .env.local file (local database connection string)
 * 3. Run: node scripts/migrate_prod_to_local.js
 * 
 * This script will:
 * 1. Clean up local database (truncate all tables)
 * 2. Copy all data from production to local
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Production database connection
const prodConnectionString = process.env.PROD_DATABASE_URL;
if (!prodConnectionString) {
    console.error('❌ PROD_DATABASE_URL environment variable is required');
    console.error('   Set it in .env.local file');
    console.error('   Example: PROD_DATABASE_URL=postgresql://user:pass@host:port/dbname');
    process.exit(1);
}

// Local database connection - use DATABASE_URL if it's local, otherwise use default local config
const localConnectionString = process.env.DATABASE_URL;
const isLocalConnection = localConnectionString && 
    (localConnectionString.includes('localhost') || 
     localConnectionString.includes('127.0.0.1') ||
     localConnectionString.includes('5433'));

const localConfig = isLocalConnection ? 
    { connectionString: localConnectionString, ssl: false } :
    {
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        port: parseInt(process.env.POSTGRES_PORT || '5433'),
        database: process.env.POSTGRES_DB || 'finance_tracker',
    };

const prodPool = new Pool({
    connectionString: prodConnectionString,
    ssl: prodConnectionString.includes('localhost') || prodConnectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false }
});

const localPool = new Pool(localConfig);

// Tables to migrate (in order to respect foreign key constraints)
const TABLES = [
    'users',
    'categories',
    'subcategories',
    'accounts',
    'transactions',
    'monthly_plans',
    'email_otps'
];

async function truncateLocal() {
    console.log('🧹 Cleaning local database...');
    
    // Disable foreign key checks temporarily
    await localPool.query('SET session_replication_role = replica;');
    
    for (const table of TABLES.reverse()) {
        try {
            await localPool.query(`TRUNCATE TABLE ${table} CASCADE;`);
            console.log(`   ✓ Truncated ${table}`);
        } catch (err) {
            console.log(`   ⚠ Could not truncate ${table}: ${err.message}`);
        }
    }
    
    // Re-enable foreign key checks
    await localPool.query('SET session_replication_role = DEFAULT;');
    
    console.log('✅ Local database cleaned\n');
}

async function copyTable(tableName) {
    console.log(`📦 Copying ${tableName}...`);
    
    try {
        // Get all data from production
        const prodResult = await prodPool.query(`SELECT * FROM ${tableName}`);
        const rows = prodResult.rows;
        
        if (rows.length === 0) {
            console.log(`   ⚠ No data in ${tableName}`);
            return;
        }
        
        // Get column names
        const columns = Object.keys(rows[0]);
        const columnList = columns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        // Insert into local database
        for (const row of rows) {
            const values = columns.map(col => row[col]);
            await localPool.query(
                `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values
            );
        }
        
        console.log(`   ✓ Copied ${rows.length} row(s) from ${tableName}`);
    } catch (err) {
        console.error(`   ❌ Error copying ${tableName}: ${err.message}`);
        throw err;
    }
}

async function migrate() {
    console.log('🚀 Starting migration from production to local...\n');
    console.log('⚠️  WARNING: This will DELETE all local data!\n');
    
    try {
        // Test connections
        console.log('🔌 Testing database connections...');
        await prodPool.query('SELECT 1');
        console.log('   ✓ Production database connected');
        await localPool.query('SELECT 1');
        console.log('   ✓ Local database connected\n');
        
        // Clean local database
        await truncateLocal();
        
        // Copy tables in order
        console.log('📥 Copying data from production...\n');
        for (const table of TABLES) {
            await copyTable(table);
        }
        
        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        for (const table of TABLES) {
            const result = await localPool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`   ${table}: ${result.rows[0].count} row(s)`);
        }
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prodPool.end();
        await localPool.end();
    }
}

// Run migration
migrate();
