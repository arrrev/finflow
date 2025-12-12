const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/finance_tracker';

const pool = new Pool({
    connectionString,
});

async function hideCategory() {
    try {
        const client = await pool.connect();
        // Get the first category
        const res = await client.query('SELECT id, name FROM categories ORDER BY name ASC LIMIT 1');
        if (res.rows.length > 0) {
            const cat = res.rows[0];
            console.log(`Hiding category: ${cat.name} (id: ${cat.id})`);
            await client.query('UPDATE categories SET include_in_chart = false WHERE id = $1', [cat.id]);
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

hideCategory();
