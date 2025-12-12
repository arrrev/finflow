import { NextResponse } from 'next/server';
import { sendOTP, verifyOTP } from '@/lib/email';
import { query } from '@/lib/db';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, type, action, code } = body;

        if (!email || !type || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (action === 'send') {
            await sendOTP(email, type);
            return NextResponse.json({ success: true, message: 'OTP sent' });
        }

        if (action === 'verify') {
            if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

            const isValid = await verifyOTP(email, code, type);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
            }

            // Perform action based on type
            if (type === 'REGISTER') {
                await query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);
            }

            // For RESET and PROFILE, the client will use the success response to proceed to the next step
            // For RESET, we might want to return a simplified temporary token or signed proof, 
            // but for this MVP, verifying here allows the client to call the next API safely 
            // (assuming the next API also verifies OTP or relies on a session + OTP check).
            // Better: Return a "reset_token" that the password reset API requires.

            // Simple verification token for now
            const verificationToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');

            return NextResponse.json({ success: true, verificationToken });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('OTP API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
