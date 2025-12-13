/**
 * Exchange rate utilities for currency conversion
 * Supports multiple currencies with fallback to free APIs
 */

// Cache for exchange rates
let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Base currency for exchange rates (USD is standard for most APIs)
const BASE_CURRENCY = 'USD';

// Fallback rates if API fails (relative to USD)
const FALLBACK_RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    AMD: 400,
    RUB: 92,
    JPY: 150,
    CNY: 7.2,
    INR: 83,
    CAD: 1.35,
    AUD: 1.52,
    CHF: 0.88,
    SEK: 10.5,
    NOK: 10.7,
    DKK: 6.9,
    PLN: 4.0,
    TRY: 32,
    AED: 3.67,
    SAR: 3.75,
    ILS: 3.7,
    KRW: 1330,
    SGD: 1.34,
    HKD: 7.8,
    NZD: 1.64,
    MXN: 17,
    BRL: 5.0,
    ZAR: 19,
};

/**
 * Fetch exchange rates from free API (exchangerate-api.com)
 * Falls back to hardcoded rates if API fails
 */
async function fetchRatesFromAPI() {
    try {
        // Using exchangerate-api.com free tier (no API key needed for base USD)
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error('Exchange rate API request failed');
        }

        const data = await response.json();
        
        if (!data.rates) {
            throw new Error('Invalid API response');
        }

        // Convert to our format: rates relative to USD
        const rates = { USD: 1 }; // Base currency
        
        // Add all supported currencies
        Object.keys(FALLBACK_RATES).forEach(currency => {
            if (data.rates[currency]) {
                rates[currency] = parseFloat(data.rates[currency]);
            } else {
                // Use fallback if not in API response
                rates[currency] = FALLBACK_RATES[currency];
            }
        });

        // Validate rates
        Object.keys(rates).forEach(currency => {
            if (isNaN(rates[currency]) || rates[currency] <= 0) {
                rates[currency] = FALLBACK_RATES[currency] || 1;
            }
        });

        return rates;
    } catch (error) {
        console.error('Failed to fetch exchange rates from API:', error.message);
        return null;
    }
}

/**
 * Get exchange rates (cached)
 * Returns rates relative to USD
 * @returns {Promise<Object>} Rates object like { USD: 1, EUR: 0.92, AMD: 400, ... }
 */
export async function getExchangeRates() {
    // Check if cache is still valid
    if (cachedRates && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedRates;
    }

    // Try to fetch from API
    const apiRates = await fetchRatesFromAPI();
    
    if (apiRates) {
        cachedRates = apiRates;
        cacheTimestamp = Date.now();
        return cachedRates;
    }

    // Fallback to hardcoded rates
    console.log('Using fallback exchange rates');
    cachedRates = { ...FALLBACK_RATES };
    cacheTimestamp = Date.now();
    return cachedRates;
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    if (!amount || amount === 0) {
        return 0;
    }

    const rates = await getExchangeRates();

    // If either currency is not in rates, return original amount
    if (!rates[fromCurrency] || !rates[toCurrency]) {
        console.warn(`Currency not supported: ${fromCurrency} or ${toCurrency}`);
        return amount;
    }

    // Convert via USD as base:
    // 1. Convert from source currency to USD
    // 2. Convert from USD to target currency
    const amountInUSD = amount / rates[fromCurrency];
    const amountInTarget = amountInUSD * rates[toCurrency];

    return amountInTarget;
}

/**
 * Convert amount from given currency to target currency (usually user's main currency)
 * @param {number} amount 
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency (default: AMD for backward compatibility)
 * @returns {Promise<number>}
 */
export async function convertToCurrency(amount, fromCurrency, toCurrency = 'AMD') {
    return convertCurrency(amount, fromCurrency, toCurrency);
}

/**
 * Convert amount from given currency to AMD (for backward compatibility)
 * @param {number} amount 
 * @param {string} currency - 'USD', 'EUR', 'AMD', etc.
 * @returns {Promise<number>}
 */
export async function convertToAMD(amount, currency) {
    if (currency === 'AMD') {
        return amount;
    }
    return convertCurrency(amount, currency, 'AMD');
}

/**
 * Convert amount from AMD to given currency (for backward compatibility)
 * @param {number} amountAMD 
 * @param {string} currency - 'USD', 'EUR', 'AMD', etc.
 * @returns {Promise<number>}
 */
export async function convertFromAMD(amountAMD, currency) {
    if (currency === 'AMD') {
        return amountAMD;
    }
    return convertCurrency(amountAMD, 'AMD', currency);
}

/**
 * Get rate for a specific currency pair
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
        return 1;
    }

    const rates = await getExchangeRates();
    
    if (!rates[fromCurrency] || !rates[toCurrency]) {
        return 1; // Default to 1 if currency not found
    }

    // Rate = (toCurrency / USD) / (fromCurrency / USD) = toCurrency / fromCurrency
    return rates[toCurrency] / rates[fromCurrency];
}
