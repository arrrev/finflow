/**
 * Exchange rate utilities for currency conversion
 * Fetches rates from Central Bank of Armenia API
 */

// Cache for exchange rates
let cachedRates = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fallback rates if API fails
const FALLBACK_RATES = {
    USD: 400,
    EUR: 420
};

/**
 * Fetch current exchange rates from CBA API
 * @returns {Promise<{USD: number, EUR: number}>}
 */
export async function getExchangeRates() {
    // Check if cache is still valid
    if (cachedRates && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return cachedRates;
    }

    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        const url = `http://api.cba.am/ExchangeRatesToCSV.ashx?DateFrom=${today}&DateTo=${today}&ISOCodes=USD,EUR`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error('CBA API request failed');
        }

        const csvText = await response.text();

        // Parse CSV: "Ամսաթիվ,USD,EUR\n12/12/2025,381.77,447.7,"
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('Invalid CSV response');
        }

        const dataLine = lines[1]; // Second line contains the data
        const parts = dataLine.split(',');

        if (parts.length < 3) {
            throw new Error('Invalid data format');
        }

        const rates = {
            USD: parseFloat(parts[1]),
            EUR: parseFloat(parts[2])
        };

        // Validate rates
        if (isNaN(rates.USD) || isNaN(rates.EUR) || rates.USD <= 0 || rates.EUR <= 0) {
            throw new Error('Invalid rate values');
        }

        // Update cache
        cachedRates = rates;
        cacheTimestamp = Date.now();

        return rates;
    } catch (error) {
        console.error('Failed to fetch exchange rates from CBA:', error.message);
        console.log('Using fallback rates:', FALLBACK_RATES);

        // Return fallback rates if API fails
        return FALLBACK_RATES;
    }
}

/**
 * Convert amount from given currency to AMD
 * @param {number} amount 
 * @param {string} currency - 'USD', 'EUR', or 'AMD'
 * @returns {Promise<number>}
 */
export async function convertToAMD(amount, currency) {
    if (currency === 'AMD') {
        return amount;
    }

    const rates = await getExchangeRates();
    return amount * rates[currency];
}

/**
 * Convert amount from AMD to given currency
 * @param {number} amountAMD 
 * @param {string} currency - 'USD', 'EUR', or 'AMD'
 * @returns {Promise<number>}
 */
export async function convertFromAMD(amountAMD, currency) {
    if (currency === 'AMD') {
        return amountAMD;
    }

    const rates = await getExchangeRates();
    return amountAMD / rates[currency];
}
