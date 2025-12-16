const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DB_DATABASE_URL;

const pool = new Pool(
    connectionString
        ? {
            connectionString,
            ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
                ? false
                : { rejectUnauthorized: false }
        }
        : {
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
            host: process.env.POSTGRES_HOST || '127.0.0.1',
            port: parseInt(process.env.POSTGRES_PORT || '5433'),
            database: process.env.POSTGRES_DB || 'finance_tracker',
        }
);

async function checkTransactions() {
    try {
        console.log('🔍 Checking local transactions...\n');
        
        // Check if user_email column exists (old schema) or user_id (new schema)
        const columnCheck = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name IN ('user_email', 'user_id')
        `);
        
        const hasUserEmail = columnCheck.rows.some(r => r.column_name === 'user_email');
        const hasUserId = columnCheck.rows.some(r => r.column_name === 'user_id');
        
        console.log(`Schema: ${hasUserId ? 'user_id (new)' : hasUserEmail ? 'user_email (old)' : 'unknown'}\n`);
        
        // Get total transaction count
        const totalRes = await pool.query('SELECT COUNT(*) as count FROM transactions');
        console.log(`📊 Total transactions in database: ${totalRes.rows[0].count}\n`);
        
        // Get users
        const usersRes = await pool.query('SELECT id, email FROM users ORDER BY id');
        console.log(`👤 Users found: ${usersRes.rows.length}\n`);
        
        if (usersRes.rows.length === 0) {
            console.log('⚠️  No users found in database');
            await pool.end();
            process.exit(0);
        }
        
        // Check transactions per user
        for (const user of usersRes.rows) {
            let txCount;
            if (hasUserId) {
                txCount = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1', [user.id]);
            } else if (hasUserEmail) {
                txCount = await pool.query('SELECT COUNT(*) as count FROM transactions WHERE user_email = $1', [user.email]);
            } else {
                console.log('⚠️  Cannot determine schema');
                break;
            }
            
            console.log(`  ${user.email} (ID: ${user.id}): ${txCount.rows[0].count} transactions`);
            
            // Show sample transactions
            if (parseInt(txCount.rows[0].count) > 0) {
                let sampleTx;
                if (hasUserId) {
                    sampleTx = await pool.query(`
                        SELECT id, amount, currency, created_at, note 
                        FROM transactions 
                        WHERE user_id = $1 
                        ORDER BY created_at DESC 
                        LIMIT 3
                    `, [user.id]);
                } else {
                    sampleTx = await pool.query(`
                        SELECT id, amount, currency, created_at, note 
                        FROM transactions 
                        WHERE user_email = $1 
                        ORDER BY created_at DESC 
                        LIMIT 3
                    `, [user.email]);
                }
                
                if (sampleTx.rows.length > 0) {
                    console.log(`    Recent transactions:`);
                    sampleTx.rows.forEach(tx => {
                        console.log(`      - ID: ${tx.id}, Amount: ${tx.amount} ${tx.currency}, Date: ${tx.created_at}, Note: ${tx.note || '(no note)'}`);
                    });
                }
            }
            console.log('');
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        await pool.end();
        process.exit(1);
    }
}

checkTransactions();

