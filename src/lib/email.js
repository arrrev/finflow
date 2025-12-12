import nodemailer from 'nodemailer';
import { query } from './db';

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"FinFlow" <noreply@finflow.com>',
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export async function sendOTP(email, type) {
    // 1. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 2. Save to DB
    await query(
        `INSERT INTO email_otps (email, code, type, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [email, code, type, expiresAt]
    );

    // 3. Send Email
    const subject = `Your Verification Code for FinFlow`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Verification Code</h2>
            <p>Your code is: <strong style="font-size: 24px;">${code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </div>
    `;

    await sendEmail({ to: email, subject, html });

    return true;
}

export async function verifyOTP(email, code, type) {
    const res = await query(
        `SELECT * FROM email_otps 
         WHERE email = $1 AND code = $2 AND type = $3 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, code, type]
    );

    if (res.rowCount === 0) return false;

    // Delete used OTP (optional, or mark used)
    await query('DELETE FROM email_otps WHERE id = $1', [res.rows[0].id]);

    return true;
}
