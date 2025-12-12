const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5433/finance_tracker';

const pool = new Pool({
    connectionString,
});

async function checkSchema() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='categories' AND column_name='include_in_chart';
        `);

        if (res.rowCount > 0) {
            console.log("EXISTS");
        } else {
            console.log("MISSING");
        }
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
