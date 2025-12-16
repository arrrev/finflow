const { query } = require('../src/lib/db');

async function deleteOriginalCurrencyColumns() {
    try {
        console.log('Deleting original_amount and original_currency columns...\n');

        const columnsToDelete = [
            { table: 'transactions', column: 'original_amount' },
            { table: 'transactions', column: 'original_currency' }
        ];

        // Verify columns exist
        console.log('🔍 Verifying columns exist...');
        const existingColumns = [];
        
        for (const { table, column } of columnsToDelete) {
            const checkRes = await query(`
                SELECT column_name 
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = $1 
                AND column_name = $2;
            `, [table, column]);
            
            if (checkRes.rows.length > 0) {
                existingColumns.push({ table, column });
                console.log(`   ✅ Found: ${table}.${column}`);
            } else {
                console.log(`   ⚠️  Not found: ${table}.${column} (may already be deleted)`);
            }
        }

        if (existingColumns.length === 0) {
            console.log('\n✅ No original currency columns found to delete.');
            process.exit(0);
        }

        console.log('\n⚠️  WARNING: This will permanently delete these columns!');
        console.log('Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');

        // Wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Delete columns
        for (const { table, column } of existingColumns) {
            try {
                console.log(`Dropping column: ${table}.${column}...`);
                await query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column} CASCADE`);
                console.log(`✅ Deleted: ${table}.${column}`);
            } catch (error) {
                console.error(`❌ Error deleting ${table}.${column}:`, error.message);
            }
        }

        console.log('\n✅ Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteOriginalCurrencyColumns();

