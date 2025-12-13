// Server-side reCAPTCHA verification utility

export async function verifyRecaptcha(token) {
    if (!token) {
        return { success: false, error: 'No reCAPTCHA token provided' };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    // Skip verification in development if no secret key is set
    if (!secretKey) {
        console.warn('RECAPTCHA_SECRET_KEY not set, skipping verification');
        return { success: true, score: 0.9 }; // Allow in development
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();

        if (data.success) {
            // reCAPTCHA v3 returns a score (0.0 to 1.0)
            // Lower scores indicate more suspicious activity
            const score = data.score || 0.5;
            const threshold = 0.5; // Adjust threshold as needed

            if (score >= threshold) {
                return { success: true, score };
            } else {
                return { success: false, error: 'reCAPTCHA verification failed: low score', score };
            }
        } else {
            return { success: false, error: 'reCAPTCHA verification failed', errors: data['error-codes'] };
        }
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false, error: 'Failed to verify reCAPTCHA' };
    }
}

