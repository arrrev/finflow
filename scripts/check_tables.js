const { query } = require('../src/lib/db');

async function checkTables() {
    try {
        // Get all tables in the database
        const tablesRes = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('Tables in database:');
        tablesRes.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Tables that should exist (from schema and migrations)
        const expectedTables = [
            'users',
            'categories',
            'subcategories',
            'accounts',
            'transactions',
            'monthly_plans'
        ];

        console.log('\nExpected tables:');
        expectedTables.forEach(table => {
            console.log(`  - ${table}`);
        });

        const existingTables = tablesRes.rows.map(r => r.table_name);
        const unusedTables = existingTables.filter(t => !expectedTables.includes(t));

        if (unusedTables.length > 0) {
            console.log('\n⚠️  Potentially unused tables:');
            unusedTables.forEach(table => {
                console.log(`  - ${table}`);
            });
        } else {
            console.log('\n✅ All tables are expected tables.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();

