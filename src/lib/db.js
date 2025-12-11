import { Pool } from 'pg';

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
    return pool.query(text, params);
};

export default pool;
