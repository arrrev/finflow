const { query } = require('../src/lib/db');
// Try to load env but don't crash if missing, defaults in db.js might work
try { require('dotenv').config({ path: '.env.local' }); } catch (e) { }

async function run() {
    try {
        console.log("Getting user 1...");
        const userRes = await query('SELECT email FROM users WHERE id = 1');
        if (userRes.rows.length === 0) {
            console.log("User 1 not found");
            return;
        }
        const email = userRes.rows[0].email;
        console.log(`Found user: ${email}. Deleting transactions...`);

        // Use user_email as confirmed by previous file edits
        const res = await query('DELETE FROM transactions WHERE user_email = $1', [email]);
        console.log(`Deleted ${res.rowCount} transactions.`);
    } catch (e) {
        console.error("Error executing delete:", e);
    }
}

run();
