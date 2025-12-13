"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";

/**
 * Component that automatically refreshes the session on user activity
 * This prolongs the session expiration when users interact with the app
 * Optimized to reduce event listener overhead
 */
export default function SessionRefresher() {
    const { data: session, update } = useSession();
    const lastRefreshRef = useRef(0);
    const refreshIntervalRef = useRef(null);
    const throttleTimeoutRef = useRef(null);

    const handleUserActivity = useCallback(() => {
        const now = Date.now();
        // Only refresh if at least 5 minutes have passed since last refresh
        // This prevents too frequent refreshes
        if (now - lastRefreshRef.current > 5 * 60 * 1000) {
            update({ prolongSession: true });
            lastRefreshRef.current = now;
        }
    }, [update]);

    useEffect(() => {
        if (!session) return;

        // Throttled handler for high-frequency events (mousemove, scroll)
        const throttledHandler = () => {
            if (throttleTimeoutRef.current) return;
            throttleTimeoutRef.current = setTimeout(() => {
                handleUserActivity();
                throttleTimeoutRef.current = null;
            }, 60000); // Throttle to once per minute for high-frequency events
        };

        // Direct handler for low-frequency events (clicks, keypress)
        const directHandler = () => {
            handleUserActivity();
        };

        // High-frequency events - use throttled handler
        window.addEventListener('mousemove', throttledHandler, { passive: true });
        window.addEventListener('scroll', throttledHandler, { passive: true });

        // Low-frequency events - use direct handler
        window.addEventListener('mousedown', directHandler, { passive: true });
        window.addEventListener('keypress', directHandler, { passive: true });
        window.addEventListener('touchstart', directHandler, { passive: true });
        window.addEventListener('click', directHandler, { passive: true });
        window.addEventListener('focus', directHandler, { passive: true });

        // Also refresh periodically (every 10 minutes) if user is active
        refreshIntervalRef.current = setInterval(() => {
            if (document.hasFocus()) {
                handleUserActivity();
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => {
            window.removeEventListener('mousemove', throttledHandler);
            window.removeEventListener('scroll', throttledHandler);
            window.removeEventListener('mousedown', directHandler);
            window.removeEventListener('keypress', directHandler);
            window.removeEventListener('touchstart', directHandler);
            window.removeEventListener('click', directHandler);
            window.removeEventListener('focus', directHandler);
            
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [session, handleUserActivity]);

    return null; // This component doesn't render anything
}


