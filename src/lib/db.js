import { Pool } from 'pg';

console.log("DB Config Check:");
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DB_DATABASE_URL;

console.log("Connection String Source:",
    process.env.DATABASE_URL ? "DATABASE_URL" :
        process.env.POSTGRES_URL ? "POSTGRES_URL" :
            process.env.POSTGRES_PRISMA_URL ? "POSTGRES_PRISMA_URL" :
                process.env.DB_DATABASE_URL ? "DB_DATABASE_URL" : "None");
console.log("POSTGRES_HOST:", process.env.POSTGRES_HOST);

const pool = new Pool(
    connectionString
        ? {
            connectionString,
            ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
                ? false
                : { rejectUnauthorized: false } // Required for cloud DBs like Neon/Vercel Postgres
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
