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

        // Add event listener with passive: false to allow preventDefault
        document.addEventListener('wheel', preventScroll, { passive: false });

        return () => {
            document.removeEventListener('wheel', preventScroll);
        };
    }, []);

    return null;
}
