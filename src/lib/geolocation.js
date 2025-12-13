/**
 * Geolocation utilities for detecting user's country
 */

/**
 * Detect country from timezone
 * This is a fallback method when IP geolocation is not available
 */
export function getCountryFromTimezone(timezone) {
    const timezoneMap = {
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'America/Mexico_City': 'MX',
        'America/Sao_Paulo': 'BR',
        'America/Buenos_Aires': 'AR',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Berlin': 'DE',
        'Europe/Rome': 'IT',
        'Europe/Madrid': 'ES',
        'Europe/Amsterdam': 'NL',
        'Europe/Brussels': 'BE',
        'Europe/Vienna': 'AT',
        'Europe/Zurich': 'CH',
        'Europe/Stockholm': 'SE',
        'Europe/Oslo': 'NO',
        'Europe/Copenhagen': 'DK',
        'Europe/Warsaw': 'PL',
        'Europe/Istanbul': 'TR',
        'Europe/Moscow': 'RU',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Hong_Kong': 'HK',
        'Asia/Singapore': 'SG',
        'Asia/Seoul': 'KR',
        'Asia/Dubai': 'AE',
        'Asia/Riyadh': 'SA',
        'Asia/Tehran': 'IR',
        'Asia/Kolkata': 'IN',
        'Asia/Jerusalem': 'IL',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Pacific/Auckland': 'NZ',
        'Asia/Yerevan': 'AM',
    };
    
    return timezoneMap[timezone] || null;
}

/**
 * Detect country from request headers (IP geolocation would be better but requires external service)
 * For now, we'll use Accept-Language header as a hint
 */
export function detectCountryFromRequest(request) {
    // Try to get country from headers (if using a service like Cloudflare, Vercel, etc.)
    const country = request.headers.get('cf-ipcountry') || 
                   request.headers.get('x-vercel-ip-country') ||
                   request.headers.get('x-country-code');
    
    if (country) {
        return country.toUpperCase();
    }
    
    // Fallback: try to detect from Accept-Language
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        // Extract language codes and map to countries (rough approximation)
        const langMap = {
            'en-US': 'US', 'en-GB': 'GB', 'en-CA': 'CA', 'en-AU': 'AU',
            'fr': 'FR', 'fr-CA': 'CA', 'fr-BE': 'BE', 'fr-CH': 'CH',
            'de': 'DE', 'de-AT': 'AT', 'de-CH': 'CH',
            'es': 'ES', 'es-MX': 'MX', 'es-AR': 'AR',
            'it': 'IT', 'pt': 'PT', 'pt-BR': 'BR',
            'nl': 'NL', 'ru': 'RU', 'pl': 'PL', 'tr': 'TR',
            'ja': 'JP', 'zh': 'CN', 'ko': 'KR', 'ar': 'AE',
            'hi': 'IN', 'he': 'IL', 'hy': 'AM',
        };
        
        const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());
        for (const lang of languages) {
            if (langMap[lang]) {
                return langMap[lang];
            }
            // Check partial matches
            const langCode = lang.split('-')[0];
            for (const [key, country] of Object.entries(langMap)) {
                if (key.startsWith(langCode)) {
                    return country;
                }
            }
        }
    }
    
    return null;
}

/**
 * Get user's country (server-side)
 * Tries multiple methods: headers, timezone, fallback
 */
export async function getUserCountry(request) {
    // Method 1: Try headers (best method if available)
    const countryFromHeaders = detectCountryFromRequest(request);
    if (countryFromHeaders) {
        return countryFromHeaders;
    }
    
    // Method 2: Try timezone (if provided)
    const timezone = request.headers.get('x-timezone');
    if (timezone) {
        const countryFromTz = getCountryFromTimezone(timezone);
        if (countryFromTz) {
            return countryFromTz;
        }
    }
    
    // Method 3: Fallback - could use external IP geolocation service here
    // For now, return null and let the system use default
    return null;
}

