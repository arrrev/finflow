const { query } = require('../src/lib/db');

async function addExchangeRateColumn() {
    try {
        console.log('Adding exchange_rate column to transactions table...\n');

        // Check if column already exists
        const checkRes = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' AND column_name = 'exchange_rate'
        `);

        if (checkRes.rows.length > 0) {
            console.log('✅ Column exchange_rate already exists');
            process.exit(0);
        }

        // Add the column
        await query(`
            ALTER TABLE transactions 
            ADD COLUMN exchange_rate JSONB
        `);

        console.log('✅ Added exchange_rate column');

        // Add comment for documentation
        await query(`
            COMMENT ON COLUMN transactions.exchange_rate IS 'Exchange rates at transaction creation time (JSON object with currency codes as keys and rates relative to USD as values)'
        `);

        console.log('✅ Added column comment');
        console.log('\n✅ Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addExchangeRateColumn();

