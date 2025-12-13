"use client";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

/**
 * Safe wrapper for useGoogleReCaptcha hook
 * Returns null if reCAPTCHA is not available (no site key configured)
 */
export function useRecaptcha() {
    try {
        const { executeRecaptcha } = useGoogleReCaptcha();
        return { executeRecaptcha: executeRecaptcha || null };
    } catch (error) {
        // reCAPTCHA provider not available (no site key configured)
        return { executeRecaptcha: null };
    }
}

