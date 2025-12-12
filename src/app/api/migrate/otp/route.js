import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Starting OTP table migration...');

        // Create email_otps table
        await query(`
            CREATE TABLE IF NOT EXISTS email_otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                code VARCHAR(6) NOT NULL,
                type VARCHAR(20) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('email_otps table created');

        // Add email_verified column to users table if it doesn't exist
        await query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'email_verified'
                ) THEN
                    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
                END IF;
            END $$;
        `);
        console.log('email_verified column added to users');

        // Mark existing users as verified
        await query(`
            UPDATE users 
            SET email_verified = TRUE 
            WHERE email_verified IS NULL OR email_verified = FALSE
        `);
        console.log('Existing users marked as verified');

        return NextResponse.json({
            success: true,
            message: 'OTP migration completed successfully'
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
