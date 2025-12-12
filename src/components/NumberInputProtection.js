'use client';

import { useEffect } from 'react';

export default function NumberInputProtection() {
    useEffect(() => {
        // Prevent scroll wheel from changing number input values
        const preventScroll = (e) => {
            if (e.target.type === 'number') {
                e.preventDefault();
            }
        };

        // Prevent arrow keys from changing number input values
        const preventArrowKeys = (e) => {
            if (e.target.type === 'number' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
            }
        };

        // Replace comma with period for decimal separator
        const handleCommaInput = (e) => {
            if (e.target.type === 'number' && e.target.value.includes(',')) {
                e.target.value = e.target.value.replace(/,/g, '.');
            }
        };

        // Add event listeners
        document.addEventListener('wheel', preventScroll, { passive: false });
        document.addEventListener('keydown', preventArrowKeys);
        document.addEventListener('input', handleCommaInput);

        return () => {
            document.removeEventListener('wheel', preventScroll);
            document.removeEventListener('keydown', preventArrowKeys);
            document.removeEventListener('input', handleCommaInput);
        };
    }, []);

    return null;
}
