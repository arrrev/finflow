// Currency symbol mapper (delegates to currencies.js for full support)
import { getCurrencySymbol as getCurrencySymbolFromLib } from './currencies';

// Date formatting utility
export function formatDate(date) {
    if (!date) return '';
    
    // If it's already a date string in YYYY-MM-DD format, parse in local timezone
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = date.split('-').map(Number);
        const d = new Date(year, month - 1, day); // Create date in local timezone
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
        const yearStr = d.getFullYear();
        return `${dayStr}-${monthStr}-${yearStr}`;
    }
    
    // Otherwise, parse as Date object
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

// Month/Year formatting utility
export function formatMonthYear(date) {
    const d = new Date(date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${month}-${year}`;
}

// DateTime formatting utility
export function formatDateTime(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// Time formatting utility (HH:MM:SS)
export function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

export function getCurrencySymbol(currency) {
    try {
        return getCurrencySymbolFromLib(currency);
    } catch (e) {
        // Fallback for backward compatibility
        const symbols = {
            'AMD': '֏',
            'USD': '$',
            'EUR': '€'
        };
        return symbols[currency] || currency;
    }
}
