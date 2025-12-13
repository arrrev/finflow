import { query } from './db';

// Use nodemailer for email sending
let nodemailerTransporter = null;

// Initialize nodemailer transporter
function initializeNodemailer() {
    if (nodemailerTransporter) return nodemailerTransporter;
    
    try {
        const nodemailer = require('nodemailer');
        
        // Check if required SMTP credentials are present
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error('SMTP credentials missing: SMTP_USER and SMTP_PASS are required');
            return null;
        }
        
        nodemailerTransporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE || 'gmail',
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        console.log('Nodemailer initialized successfully');
        return nodemailerTransporter;
    } catch (err) {
        console.error('Failed to initialize nodemailer:', err);
        return null;
    }
}

// Initialize on module load
initializeNodemailer();

export async function sendEmail({ to, subject, html }) {
    try {
        // Ensure transporter is initialized
        const transporter = initializeNodemailer();
        if (!transporter) {
            throw new Error('Email service not configured. Please check SMTP settings.');
        }

        const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@finflow42.com';
        const fromName = process.env.SMTP_FROM_NAME || 'FinFlow42';

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });
        
        console.log('Message sent via nodemailer: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            response: error.response,
            responseCode: error.responseCode,
        });
        
        // Provide more user-friendly error messages
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check SMTP credentials.');
        } else if (error.code === 'ECONNECTION') {
            throw new Error('Could not connect to email server. Please check SMTP settings.');
        } else if (error.message) {
            throw error;
        } else {
            throw new Error('Failed to send email. Please try again later.');
        }
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
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                        FinFlow
                                    </h1>
                                    <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                                        Your Financial Command Center
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                        Verification Code
                                    </h2>
                                    <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.5;">
                                        Use this code to verify your account. This code will expire in 10 minutes.
                                    </p>
                                    
                                    <!-- Code Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                                        <tr>
                                            <td align="center" style="background-color: #f8f9fa; border: 2px dashed #e0e0e0; border-radius: 8px; padding: 24px;">
                                                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                                                    ${code}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                                        If you didn't request this code, you can safely ignore this email. Someone else might have typed your email address by mistake.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e0e0e0;">
                                    <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.5;">
                                        This is an automated message from FinFlow.<br>
                                        © ${new Date().getFullYear()} FinFlow. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
