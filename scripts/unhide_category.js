const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/finance_tracker';

const pool = new Pool({
    connectionString,
});

async function unhideCategory() {
    try {
        const client = await pool.connect();
        // Unhide Bill
        await client.query("UPDATE categories SET include_in_chart = true WHERE name = 'Bill'");
        console.log("Unhid category: Bill");
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

unhideCategory();
