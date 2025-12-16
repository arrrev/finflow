const { query } = require('../src/lib/db');

async function migrateToUserId() {
    try {
        console.log('=====================================================');
        console.log('Migration: Change transactions from user_email to user_id');
        console.log('=====================================================\n');

        // Step 1: Add user_id column
        console.log('1. Adding user_id column...');
        await query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS user_id INTEGER
        `);
        console.log('   ✅ user_id column added\n');

        // Step 2: Populate user_id from user_email
        console.log('2. Populating user_id from user_email...');
        const updateRes = await query(`
            UPDATE transactions t
            SET user_id = u.id
            FROM users u
            WHERE t.user_email = u.email AND t.user_id IS NULL
        `);
        console.log(`   ✅ Updated ${updateRes.rowCount} transaction(s)\n`);

        // Step 3: Check for any NULL user_id (should be 0)
        const nullCheck = await query(`
            SELECT COUNT(*) as count FROM transactions WHERE user_id IS NULL
        `);
        const nullCount = parseInt(nullCheck.rows[0].count || 0);
        
        if (nullCount > 0) {
            console.error(`   ⚠️  WARNING: ${nullCount} transactions have NULL user_id!`);
            console.error('   These transactions cannot be migrated automatically.');
            process.exit(1);
        }

        // Step 4: Make user_id NOT NULL
        console.log('3. Making user_id NOT NULL...');
        await query(`
            ALTER TABLE transactions 
            ALTER COLUMN user_id SET NOT NULL
        `);
        console.log('   ✅ user_id is now NOT NULL\n');

        // Step 5: Add foreign key constraint
        console.log('4. Adding foreign key constraint...');
        await query(`
            ALTER TABLE transactions 
            DROP CONSTRAINT IF EXISTS transactions_user_id_fkey
        `);
        await query(`
            ALTER TABLE transactions 
            ADD CONSTRAINT transactions_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
        console.log('   ✅ Foreign key constraint added\n');

        // Step 6: Drop old foreign key on user_email
        console.log('5. Dropping old foreign key on user_email...');
        await query(`
            ALTER TABLE transactions 
            DROP CONSTRAINT IF EXISTS transactions_user_email_fkey
        `);
        console.log('   ✅ Old foreign key dropped\n');

        // Step 7: Update indexes
        console.log('6. Updating indexes...');
        await query(`DROP INDEX IF EXISTS idx_transactions_user_email`);
        await query(`DROP INDEX IF EXISTS idx_transactions_user_account`);
        await query(`DROP INDEX IF EXISTS idx_transactions_user_date`);
        
        await query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_id, account_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, created_at)`);
        console.log('   ✅ Indexes updated\n');

        // Step 8: Drop accounts.balance column (no longer used - balances calculated on the fly)
        console.log('7. Dropping accounts.balance column...');
        const balanceColumnCheck = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'accounts' 
            AND column_name = 'balance'
        `);
        
        if (balanceColumnCheck.rows.length > 0) {
            await query(`ALTER TABLE accounts DROP COLUMN IF EXISTS balance`);
            console.log('   ✅ accounts.balance column dropped\n');
        } else {
            console.log('   ℹ️  accounts.balance column does not exist (already removed)\n');
        }

        console.log('=====================================================');
        console.log('✅ Migration completed successfully!');
        console.log('=====================================================');
        console.log('\nNext steps:');
        console.log('1. Application code already updated to use user_id');
        console.log('2. Test thoroughly');
        console.log('3. After verification, run: ALTER TABLE transactions DROP COLUMN user_email;');
        console.log('=====================================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

migrateToUserId();

