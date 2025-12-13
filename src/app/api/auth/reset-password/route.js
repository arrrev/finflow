import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyOTP } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, code, newPassword, recaptchaToken } = body;

        // Verify reCAPTCHA
        if (recaptchaToken) {
            const recaptchaResult = await verifyRecaptcha(recaptchaToken);
            if (!recaptchaResult.success) {
                return NextResponse.json(
                    { error: 'reCAPTCHA verification failed. Please try again.' },
                    { status: 400 }
                );
            }
        }

        if (!email || !code || !newPassword) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        // Verify OTP
        const isValid = await verifyOTP(email, code, 'RESET');
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User
        // Also set email_verified = true since they proved ownership
        await query(
            `UPDATE users 
             SET password_hash = $1, email_verified = TRUE 
             WHERE email = $2`,
            [hashedPassword, email]
        );

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
