const { query } = require('../src/lib/db');

async function resetAccountBalances() {
    try {
        const userEmail = 'armarty5@gmail.com';
        
        console.log(`Resetting account balances to 0 for user: ${userEmail}\n`);

        // First, get the user ID
        const userRes = await query(`
            SELECT id FROM users WHERE email = $1
        `, [userEmail]);

        if (userRes.rows.length === 0) {
            console.error(`❌ User with email ${userEmail} not found`);
            process.exit(1);
        }

        const userId = userRes.rows[0].id;
        console.log(`✅ Found user ID: ${userId}\n`);

        // Get all accounts for this user
        const accountsRes = await query(`
            SELECT id, name, balance, initial_balance
            FROM accounts
            WHERE user_id = $1
            ORDER BY name ASC
        `, [userId]);

        if (accountsRes.rows.length === 0) {
            console.log('ℹ️  No accounts found for this user');
            process.exit(0);
        }

        console.log(`Found ${accountsRes.rows.length} account(s):\n`);

        // Update all balances to 0
        for (const acc of accountsRes.rows) {
            await query(`
                UPDATE accounts 
                SET balance = 0
                WHERE id = $1
            `, [acc.id]);

            console.log(`✅ ${acc.name}: ${parseFloat(acc.balance || 0).toFixed(2)} → 0.00`);
        }

        console.log(`\n✅ All account balances reset to 0 for ${userEmail}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAccountBalances();

