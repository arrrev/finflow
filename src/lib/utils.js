// Currency symbol mapper (delegates to currencies.js for full support)
import { getCurrencySymbol as getCurrencySymbolFromLib } from './currencies';

// Date formatting utility
export function formatDate(date) {
    if (!date || date === null || date === undefined) return '';
    
    // Handle invalid date strings
    if (typeof date === 'string' && (date === 'null' || date === 'undefined' || date === 'Invalid Date')) {
        console.error('Invalid date string:', date);
        return '';
    }
    
    let d;
    
    // If it's exactly a date string in YYYY-MM-DD format (no time component), parse in local timezone
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
            console.error('Invalid date components:', { year, month, day, original: date });
            return '';
        }
        d = new Date(year, month - 1, day); // Create date in local timezone
    } else {
        // Otherwise, parse as Date object (handles ISO timestamps, Date objects, etc.)
        d = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        console.error('Invalid date:', date, typeof date);
        return '';
    }
    
    try {
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
        const yearStr = d.getFullYear();
        
        // Validate that we got valid values
        if (!dayStr || !monthStr || isNaN(yearStr) || yearStr < 1900 || yearStr > 2100) {
            console.error('Invalid formatted date values:', { dayStr, monthStr, yearStr, original: date });
            return '';
        }
        
        return `${dayStr}-${monthStr}-${yearStr}`;
    } catch (error) {
        console.error('Error formatting date:', error, date);
        return '';
    }
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
    if (!date) return '';
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        console.error('Invalid date for time formatting:', date);
        return '';
    }
    
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
