const { query } = require('../src/lib/db');

async function recalculateAccountBalances() {
    try {
        console.log('Recalculating account balances for all users...\n');
        console.log('This will set balance = initial_balance + sum of all transactions for each account.\n');

        // Get all accounts
        const accountsRes = await query(`
            SELECT id, user_id, name, initial_balance 
            FROM accounts
            ORDER BY user_id, name
        `);

        if (accountsRes.rows.length === 0) {
            console.log('ℹ️  No accounts found');
            process.exit(0);
        }

        console.log(`Found ${accountsRes.rows.length} account(s) across all users\n`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const acc of accountsRes.rows) {
            try {
                const accountId = acc.id;
                const initialBalance = parseFloat(acc.initial_balance || 0);

                // Get sum of all transactions for this account
                const txRes = await query(`
                    SELECT COALESCE(SUM(amount), 0) as total
                    FROM transactions
                    WHERE account_id = $1
                `, [accountId]);

                const txSum = parseFloat(txRes.rows[0].total || 0);
                const calculatedBalance = initialBalance + txSum;

                // Get current balance for comparison
                const currentRes = await query(`
                    SELECT balance FROM accounts WHERE id = $1
                `, [accountId]);
                const currentBalance = parseFloat(currentRes.rows[0]?.balance || 0);

                // Update account balance
                await query(`
                    UPDATE accounts 
                    SET balance = $1
                    WHERE id = $2
                `, [calculatedBalance, accountId]);

                // Only log if balance changed
                if (Math.abs(currentBalance - calculatedBalance) > 0.01) {
                    console.log(`✅ ${acc.name} (ID: ${accountId}): ${currentBalance.toFixed(2)} → ${calculatedBalance.toFixed(2)} (initial: ${initialBalance.toFixed(2)} + transactions: ${txSum.toFixed(2)})`);
                } else {
                    console.log(`✓ ${acc.name} (ID: ${accountId}): ${calculatedBalance.toFixed(2)} (unchanged)`);
                }

                updatedCount++;
            } catch (error) {
                console.error(`❌ Error updating account ${acc.name} (ID: ${acc.id}):`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Recalculation completed!`);
        console.log(`   Updated: ${updatedCount} account(s)`);
        if (errorCount > 0) {
            console.log(`   Errors: ${errorCount} account(s)`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

recalculateAccountBalances();

