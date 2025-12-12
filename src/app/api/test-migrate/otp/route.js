import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Running OTP migration...');

        // 1. Create email_otps table
        await query(`
            CREATE TABLE IF NOT EXISTS email_otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                type VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await query(`
            CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
        `);

        // 2. Add email_verified to users
        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
        `);

        await query(`
            UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
        `);

        console.log('OTP Migration successful!');
        return NextResponse.json({ success: true, message: 'OTP Migration completed' });
    } catch (error) {
        console.error('OTP Migration failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
