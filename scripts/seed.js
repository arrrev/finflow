const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    host: process.env.POSTGRES_HOST || '127.0.0.1', // Force IPv4
    port: parseInt(process.env.POSTGRES_PORT || '5433'),
    database: process.env.POSTGRES_DB || 'finance_tracker',
});

const categories = [
    'bill', 'mortgage', 'lunch', 'eating out', 'grocery', 'care', 'car', 'petrol',
    'transport', 'shopping', 'gift', 'holiday', 'other', 'entertainment', 'home',
    'salary', 'tax return', 'interest', 'transfer'
];

const accounts = [
    'card', 'cash', 'idbank', 'ameria', 'cash $', 'saving reserve', 'overdraft ameria'
];

const targetEmail = 'armarty5@gmail.com';
const targetPassword = 'SecurePassword123!';

async function main() {
    try {
        console.log('Reading schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        await pool.query(schemaSql);

        console.log('Seeding categories...');
        for (const cat of categories) {
            await pool.query(
                `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                [cat]
            );
        }

        console.log('Seeding accounts...');
        for (const acc of accounts) {
            await pool.query(
                `INSERT INTO accounts (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
                [acc]
            );
        }

        console.log('Seeding user...');
        const hashedPassword = await bcrypt.hash(targetPassword, 10);
        // Only insert if not exists
        const userRes = await pool.query(`SELECT id FROM users WHERE email = $1`, [targetEmail]);
        if (userRes.rowCount === 0) {
            await pool.query(
                `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
                [targetEmail, hashedPassword]
            );
            console.log(`User created: ${targetEmail}`);
        } else {
            console.log(`User already exists: ${targetEmail}`);
        }

        console.log('Seed completed successfully.');

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await pool.end();
    }
}

main();
