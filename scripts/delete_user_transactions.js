const { query } = require('../src/lib/db');

async function deleteUserTransactions() {
    try {
        const userEmail = 'armarty5@gmail.com';
        
        console.log(`Deleting all transactions for user: ${userEmail}\n`);

        // First, verify the user exists
        const userRes = await query(`
            SELECT id FROM users WHERE email = $1
        `, [userEmail]);

        if (userRes.rows.length === 0) {
            console.error(`❌ User with email ${userEmail} not found`);
            process.exit(1);
        }

        const userId = userRes.rows[0].id;
        console.log(`✅ Found user ID: ${userId}\n`);

        // Get count of transactions before deletion
        const countRes = await query(`
            SELECT COUNT(*) as count
            FROM transactions
            WHERE user_email = $1
        `, [userEmail]);

        const transactionCount = parseInt(countRes.rows[0].count || 0);
        
        if (transactionCount === 0) {
            console.log('ℹ️  No transactions found for this user');
            process.exit(0);
        }

        console.log(`Found ${transactionCount} transaction(s) to delete\n`);

        // Delete all transactions for this user
        const deleteRes = await query(`
            DELETE FROM transactions
            WHERE user_email = $1
        `, [userEmail]);

        console.log(`✅ Deleted ${deleteRes.rowCount} transaction(s)`);
        console.log(`\n✅ All transactions deleted for ${userEmail}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteUserTransactions();

