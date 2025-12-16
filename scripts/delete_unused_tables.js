const { query } = require('../src/lib/db');

async function deleteUnusedTables() {
    try {
        console.log('Checking for unused tables...\n');

        // Get all tables in the database
        const tablesRes = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        // Tables that are actively used in the application
        const usedTables = [
            'users',
            'categories',
            'subcategories',
            'accounts',
            'transactions',
            'monthly_plans',
            'email_otps' // Used for OTP verification
        ];

        const existingTables = tablesRes.rows.map(r => r.table_name);
        const unusedTables = existingTables.filter(t => !usedTables.includes(t));

        if (unusedTables.length === 0) {
            console.log('✅ No unused tables found. All tables are in use.');
            process.exit(0);
        }

        console.log('⚠️  Found unused tables:');
        unusedTables.forEach(table => {
            console.log(`  - ${table}`);
        });

        console.log('\n⚠️  WARNING: This will permanently delete these tables and all their data!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete unused tables
        for (const table of unusedTables) {
            try {
                console.log(`Dropping table: ${table}...`);
                await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`✅ Deleted: ${table}`);
            } catch (error) {
                console.error(`❌ Error deleting ${table}:`, error.message);
            }
        }

        console.log('\n✅ Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

deleteUnusedTables();

