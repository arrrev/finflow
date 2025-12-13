/**
 * Currency utilities and mappings
 */

// Common currencies with their symbols and country mappings
export const CURRENCIES = {
    'USD': { symbol: '$', name: 'US Dollar', countries: ['US', 'EC', 'SV', 'ZW'] },
    'EUR': { symbol: '€', name: 'Euro', countries: ['AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'] },
    'GBP': { symbol: '£', name: 'British Pound', countries: ['GB', 'GG', 'JE', 'IM'] },
    'AMD': { symbol: '֏', name: 'Armenian Dram', countries: ['AM'] },
    'RUB': { symbol: '₽', name: 'Russian Ruble', countries: ['RU'] },
    'JPY': { symbol: '¥', name: 'Japanese Yen', countries: ['JP'] },
    'CNY': { symbol: '¥', name: 'Chinese Yuan', countries: ['CN'] },
    'INR': { symbol: '₹', name: 'Indian Rupee', countries: ['IN'] },
    'CAD': { symbol: 'C$', name: 'Canadian Dollar', countries: ['CA'] },
    'AUD': { symbol: 'A$', name: 'Australian Dollar', countries: ['AU'] },
    'CHF': { symbol: 'CHF', name: 'Swiss Franc', countries: ['CH', 'LI'] },
    'SEK': { symbol: 'kr', name: 'Swedish Krona', countries: ['SE'] },
    'NOK': { symbol: 'kr', name: 'Norwegian Krone', countries: ['NO'] },
    'DKK': { symbol: 'kr', name: 'Danish Krone', countries: ['DK'] },
    'PLN': { symbol: 'zł', name: 'Polish Zloty', countries: ['PL'] },
    'TRY': { symbol: '₺', name: 'Turkish Lira', countries: ['TR'] },
    'AED': { symbol: 'د.إ', name: 'UAE Dirham', countries: ['AE'] },
    'SAR': { symbol: '﷼', name: 'Saudi Riyal', countries: ['SA'] },
    'ILS': { symbol: '₪', name: 'Israeli Shekel', countries: ['IL'] },
    'KRW': { symbol: '₩', name: 'South Korean Won', countries: ['KR'] },
    'SGD': { symbol: 'S$', name: 'Singapore Dollar', countries: ['SG'] },
    'HKD': { symbol: 'HK$', name: 'Hong Kong Dollar', countries: ['HK'] },
    'NZD': { symbol: 'NZ$', name: 'New Zealand Dollar', countries: ['NZ'] },
    'MXN': { symbol: '$', name: 'Mexican Peso', countries: ['MX'] },
    'BRL': { symbol: 'R$', name: 'Brazilian Real', countries: ['BR'] },
    'ZAR': { symbol: 'R', name: 'South African Rand', countries: ['ZA'] },
};

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code) {
    return CURRENCIES[code]?.symbol || code;
}

/**
 * Get currency name
 */
export function getCurrencyName(code) {
    return CURRENCIES[code]?.name || code;
}

/**
 * Get all available currency codes
 */
export function getAllCurrencyCodes() {
    return Object.keys(CURRENCIES);
}

/**
 * Detect main currency based on country code
 */
export function getCurrencyByCountry(countryCode) {
    if (!countryCode) return 'USD'; // Default fallback
    
    const upperCountry = countryCode.toUpperCase();
    
    // Find currency for this country
    for (const [code, data] of Object.entries(CURRENCIES)) {
        if (data.countries.includes(upperCountry)) {
            return code;
        }
    }
    
    // Default fallback based on common regions
    if (['US', 'CA', 'MX', 'AU', 'NZ'].includes(upperCountry)) return 'USD';
    if (['GB', 'IE'].includes(upperCountry)) return 'GBP';
    if (['JP', 'CN', 'KR', 'SG', 'HK', 'TW'].includes(upperCountry)) return upperCountry === 'JP' ? 'JPY' : 'CNY';
    
    return 'USD'; // Final fallback
}

/**
 * Get currency options for select dropdowns
 */
export function getCurrencyOptions(enabledCurrencies = null) {
    const currencies = enabledCurrencies || getAllCurrencyCodes();
    return currencies.map(code => ({
        value: code,
        label: `${code} - ${getCurrencyName(code)} (${getCurrencySymbol(code)})`
    }));
}

