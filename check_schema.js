const { query } = require('./src/lib/db');

async function checkSchema() {
    try {
        const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' ORDER BY ordinal_position");
        console.log('Transactions columns:', res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkSchema();
