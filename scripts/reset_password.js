const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const config = {
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
};

if (!config.connectionString) {
    console.error("Error: DATABASE_URL or POSTGRES_URL not found in .env.local");
    console.error("Please ensure you have your production database URL set.");
    process.exit(1);
}

const pool = new Pool(config);

async function resetPassword(email, newPassword) {
    if (!email || !newPassword) {
        console.log("Usage: node scripts/reset_password.js <email> <new_password>");
        process.exit(1);
    }

    try {
        console.log(`Resetting password for: ${email}`);

        // 1. Check if user exists
        const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (check.rows.length === 0) {
            console.error(`User not found: ${email}`);
            process.exit(1);
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);

        console.log("✅ Password updated successfully!");
        console.log(`Try logging in as ${email} with the new password.`);

    } catch (err) {
        console.error("Error updating password:", err);
    } finally {
        await pool.end();
    }
}

const args = process.argv.slice(2);
resetPassword(args[0], args[1]);
