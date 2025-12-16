const { query } = require('../src/lib/db');

async function migrateToV2() {
    try {
        console.log('=====================================================');
        console.log('Migration Script for Finance Tracker v2');
        console.log('=====================================================\n');

        // 1. Add balance column to accounts
        console.log('1. Adding balance column to accounts table...');
        await query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0
        `);
        await query(`
            COMMENT ON COLUMN accounts.balance IS 'Current balance in account currency (initial_balance + sum of transactions). Updated automatically on transaction create/edit/delete.'
        `);
        console.log('   ✅ Balance column added\n');

        // 2. Add exchange_rate column to transactions
        console.log('2. Adding exchange_rate column to transactions table...');
        await query(`
            ALTER TABLE transactions 
            ADD COLUMN IF NOT EXISTS exchange_rate JSONB
        `);
        await query(`
            COMMENT ON COLUMN transactions.exchange_rate IS 'Exchange rates at transaction creation time (JSON object with currency codes as keys and rates relative to USD as values)'
        `);
        console.log('   ✅ Exchange rate column added\n');

        // 3. Add performance indexes
        console.log('3. Adding performance indexes...');
        
        const indexes = [
            // Transactions
            'CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON transactions(user_email)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_email, account_id)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_email, created_at)',
            
            // Monthly plans
            'CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_id ON monthly_plans(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_monthly_plans_month ON monthly_plans(month)',
            'CREATE INDEX IF NOT EXISTS idx_monthly_plans_user_month ON monthly_plans(user_id, month)',
            'CREATE INDEX IF NOT EXISTS idx_monthly_plans_category_id ON monthly_plans(category_id)',
            
            // Categories
            'CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)',
            
            // Accounts
            'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)',
            
            // Subcategories
            'CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id)'
        ];

        for (const indexSql of indexes) {
            try {
                await query(indexSql);
            } catch (error) {
                console.error(`   ⚠️  Error creating index: ${error.message}`);
            }
        }
        console.log('   ✅ Performance indexes added\n');

        // 4. Calculate initial balances
        console.log('4. Calculating initial balances for existing accounts...');
        const accountsRes = await query(`
            SELECT id, name, initial_balance 
            FROM accounts
        `);

        let updatedCount = 0;
        for (const acc of accountsRes.rows) {
            const initialBalance = parseFloat(acc.initial_balance || 0);
            
            const txRes = await query(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE account_id = $1
            `, [acc.id]);

            const txSum = parseFloat(txRes.rows[0].total || 0);
            const calculatedBalance = initialBalance + txSum;

            await query(`
                UPDATE accounts 
                SET balance = $1
                WHERE id = $2
            `, [calculatedBalance, acc.id]);

            updatedCount++;
        }
        console.log(`   ✅ Calculated balances for ${updatedCount} account(s)\n`);

        console.log('=====================================================');
        console.log('✅ Migration completed successfully!');
        console.log('=====================================================');
        console.log('\nNext steps:');
        console.log('1. Verify balances are correct');
        console.log('2. Run: node scripts/recalculate_account_balances.js (optional, for verification)');
        console.log('=====================================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

migrateToV2();

