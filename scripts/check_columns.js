const { query } = require('../src/lib/db');

async function checkColumns() {
    try {
        const tables = ['users', 'categories', 'subcategories', 'accounts', 'transactions', 'monthly_plans', 'email_otps'];
        
        console.log('Checking columns in all tables...\n');

        for (const table of tables) {
            const columnsRes = await query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [table]);

            if (columnsRes.rows.length > 0) {
                console.log(`📋 Table: ${table}`);
                columnsRes.rows.forEach(col => {
                    console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
                });
                console.log('');
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkColumns();

