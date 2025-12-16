const { query } = require('../src/lib/db');

async function migrateAccountBalance() {
    try {
        console.log('Adding balance column to accounts table...\n');

        // Add balance column if it doesn't exist
        await query(`
            ALTER TABLE accounts 
            ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0
        `);
        console.log('✅ Added balance column');

        // Calculate and set balance for all existing accounts
        // Balance = initial_balance + sum of all transactions for that account
        const accountsRes = await query(`
            SELECT id, initial_balance 
            FROM accounts
        `);

        console.log(`\nCalculating balances for ${accountsRes.rows.length} accounts...\n`);

        for (const acc of accountsRes.rows) {
            const accountId = acc.id;
            const initialBalance = parseFloat(acc.initial_balance || 0);

            // Get sum of all transactions for this account
            const txRes = await query(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM transactions
                WHERE account_id = $1
            `, [accountId]);

            const txSum = parseFloat(txRes.rows[0].total || 0);
            const totalBalance = initialBalance + txSum;

            // Update account balance
            await query(`
                UPDATE accounts 
                SET balance = $1
                WHERE id = $2
            `, [totalBalance, accountId]);

            console.log(`✅ Account ${accountId}: ${totalBalance.toFixed(2)} (initial: ${initialBalance.toFixed(2)} + transactions: ${txSum.toFixed(2)})`);
        }

        // Add comment for documentation
        await query(`
            COMMENT ON COLUMN accounts.balance IS 'Current balance in account currency (initial_balance + sum of transactions). Updated automatically on transaction create/edit/delete.'
        `);

        console.log('\n✅ Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

migrateAccountBalance();

