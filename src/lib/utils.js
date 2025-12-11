// Date formatting utility
export function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

// Currency symbol mapper
export function getCurrencySymbol(currency) {
    const symbols = {
        'AMD': '֏',
        'USD': '$',
        'EUR': '€'
    };
    return symbols[currency] || currency;
}
