
const { query } = require('../src/lib/db');

async function runMigration() {
    try {
        console.log('Running migration: Add initial_balance to accounts...');
        await query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15, 2) DEFAULT 0;
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
