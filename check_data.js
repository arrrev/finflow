const { query } = require('./src/lib/db');

async function checkData() {
    try {
        const cats = await query('SELECT COUNT(*) FROM categories');
        console.log('Total categories:', cats.rows[0].count);

        const catsSample = await query('SELECT id, name, user_id FROM categories LIMIT 5');
        console.log('Sample categories:', catsSample.rows);

        const users = await query('SELECT id, email FROM users');
        console.log('Users:', users.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

checkData();
