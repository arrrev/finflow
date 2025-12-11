import { Pool } from 'pg';

console.log("DB Config Check:");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set (Length: " + process.env.DATABASE_URL.length + ")" : "Not Set");
console.log("POSTGRES_HOST:", process.env.POSTGRES_HOST);
console.log("POSTGRES_USER:", process.env.POSTGRES_USER);

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for most cloud DBs like Neon/Vercel Postgres
        }
        : {
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
            host: process.env.POSTGRES_HOST || '127.0.0.1',
            port: parseInt(process.env.POSTGRES_PORT || '5433'),
            database: process.env.POSTGRES_DB || 'finance_tracker',
        }
);

export const query = async (text, params) => {
    try {
        return await pool.query(text, params);
    } catch (error) {
        console.error("DB Query Error:", error);
        throw error;
    }
};

export default pool;
