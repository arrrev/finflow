"use client";
import { useEffect } from 'react';

export default function ModalScrollFix() {
    useEffect(() => {
        const preventScrollLock = () => {
            // Check if any modal is open
            const hasModal = document.querySelector('.modal-open') || 
                           document.querySelector('dialog[open]') ||
                           document.body.classList.contains('modal-open');
            
            if (hasModal) {
                // Force allow body scrolling when modal is open
                document.body.style.overflow = 'auto';
                document.body.style.overflowX = 'hidden';
                document.documentElement.style.overflow = 'auto';
                document.documentElement.style.overflowX = 'hidden';
            }
        };

        // Watch for modals being opened/closed
        const observer = new MutationObserver(() => {
            preventScrollLock();
        });

        // Observe changes to the document body and html
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        // Check immediately and set up interval as backup (less frequent to avoid interference)
        preventScrollLock();
        const interval = setInterval(preventScrollLock, 500);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    return null;
}

