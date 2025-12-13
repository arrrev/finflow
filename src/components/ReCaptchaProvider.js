"use client";
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { useEffect, useState } from 'react';

export default function ReCaptchaProvider({ children }) {
    const [siteKey, setSiteKey] = useState(null);

    useEffect(() => {
        // Get site key from environment (client-side accessible)
        setSiteKey(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null);
    }, []);

    // Always render the provider to ensure the hook is available
    // If no site key, the provider will handle it gracefully and executeRecaptcha will be undefined
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={siteKey || ''}
            language="en"
            scriptProps={{
                async: false,
                defer: false,
                appendTo: "head",
                nonce: undefined,
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}

