const { query } = require('../src/lib/db');

async function deleteUnusedColumns() {
    try {
        console.log('Analyzing unused columns...\n');

        // Columns that are NOT used (legacy or deprecated)
        const unusedColumns = {
            'transactions': [
                'category_name',  // Legacy - using category_id now
                'account_name'   // Legacy - using account_id now
            ],
            'accounts': [
                'balance_amd'     // Not stored in DB, calculated on the fly
            ]
        };

        console.log('⚠️  Columns to be deleted:');
        for (const [table, columns] of Object.entries(unusedColumns)) {
            console.log(`\n📋 Table: ${table}`);
            columns.forEach(col => {
                console.log(`   - ${col}`);
            });
        }

        // Verify columns exist
        console.log('\n🔍 Verifying columns exist...');
        const columnsToDelete = [];
        
        for (const [table, columns] of Object.entries(unusedColumns)) {
            for (const column of columns) {
                const checkRes = await query(`
                    SELECT column_name 
                    FROM information_schema.columns
                    WHERE table_schema = 'public' 
                    AND table_name = $1 
                    AND column_name = $2;
                `, [table, column]);
                
                if (checkRes.rows.length > 0) {
                    columnsToDelete.push({ table, column });
                    console.log(`   ✅ Found: ${table}.${column}`);
                } else {
                    console.log(`   ⚠️  Not found: ${table}.${column} (may already be deleted)`);
                }
            }
        }

        if (columnsToDelete.length === 0) {
            console.log('\n✅ No unused columns found to delete.');
            process.exit(0);
        }

        console.log('\n⚠️  WARNING: This will permanently delete these columns and all their data!');
        console.log('⚠️  Make sure you have a backup before proceeding!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete unused columns
        for (const { table, column } of columnsToDelete) {
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

deleteUnusedColumns();

