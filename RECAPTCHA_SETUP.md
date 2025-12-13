# reCAPTCHA v3 Setup Guide

Hidden reCAPTCHA v3 has been integrated into all authentication and OTP endpoints to protect against bots and abuse.

## What's Protected

The following endpoints now include reCAPTCHA verification:

1. **Sign In** (`/auth/signin`)
2. **Registration** (`/register`)
3. **Email Verification** (`/auth/verify`) - both sending and verifying OTP
4. **Forgot Password** (`/auth/forgot-password`) - sending OTP
5. **Reset Password** (`/auth/reset-password`) - verifying OTP and resetting password

## Setup Instructions

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to register a new site
3. Choose **reCAPTCHA v3**
4. Add your domain (e.g., `finflow42.com`)
5. Accept the terms and submit
6. Copy your **Site Key** and **Secret Key**

### 2. Add Environment Variables

Add the following to your `.env.local` file:

```env
# reCAPTCHA v3 Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**Important:**
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is exposed to the client (must start with `NEXT_PUBLIC_`)
- `RECAPTCHA_SECRET_KEY` is server-side only (never expose this)

### 3. Deploy

After adding the environment variables:
- Restart your development server
- Update your production environment variables
- Redeploy your application

## How It Works

- **Client-side**: reCAPTCHA v3 runs invisibly in the background when users interact with auth forms
- **Server-side**: Each auth request includes a reCAPTCHA token that is verified before processing
- **Score-based**: reCAPTCHA v3 returns a score (0.0 to 1.0). Requests with scores below 0.5 are rejected
- **Graceful degradation**: If reCAPTCHA keys are not configured, the app will work without verification (useful for development)

## Development Mode

If you don't set the environment variables, the app will work normally without reCAPTCHA verification. This allows you to develop and test locally without needing reCAPTCHA keys.

## Testing

1. Set up your reCAPTCHA keys in `.env.local`
2. Restart your development server
3. Try signing in, registering, or resetting a password
4. Check the browser console and server logs for any reCAPTCHA-related messages

## Troubleshooting

- **"reCAPTCHA not available" warnings**: This is normal if keys are not set (development mode)
- **Verification failures**: Check that your domain is registered in reCAPTCHA console
- **Low scores**: Adjust the threshold in `src/lib/recaptcha.js` (currently 0.5)

