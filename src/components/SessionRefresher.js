"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";

/**
 * Component that automatically refreshes the session on user activity
 * This prolongs the session expiration when users interact with the app
 * Optimized to reduce event listener overhead and prevent unnecessary re-renders
 */
export default function SessionRefresher() {
    const { data: session, update } = useSession();
    const lastRefreshRef = useRef(0);
    const refreshIntervalRef = useRef(null);
    const throttleTimeoutRef = useRef(null);
    const clickThrottleRef = useRef(null);
    const sessionIdRef = useRef(null);
    const hasInitializedRef = useRef(false);
    const pageLoadTimeRef = useRef(Date.now());
    const hasHandledInitialFocusRef = useRef(false);

    // Track session ID to prevent re-initialization when session object reference changes
    const currentSessionId = session?.user?.id;
    if (currentSessionId && sessionIdRef.current !== currentSessionId) {
        sessionIdRef.current = currentSessionId;
        hasInitializedRef.current = false; // Reset on user change
        pageLoadTimeRef.current = Date.now(); // Reset page load time on user change
        hasHandledInitialFocusRef.current = false; // Reset focus handler flag
    }

    const handleUserActivity = useCallback(() => {
        const now = Date.now();
        const timeSinceLoad = now - pageLoadTimeRef.current;
        
        // Don't update session within first 30 seconds after page load
        // This prevents page reloads on initial load
        if (timeSinceLoad < 30000) {
            return;
        }
        
        // Only refresh if at least 5 minutes have passed since last refresh
        // This prevents too frequent refreshes and unnecessary session updates
        if (now - lastRefreshRef.current > 5 * 60 * 1000) {
            update({ prolongSession: true });
            lastRefreshRef.current = now;
        }
    }, [update]);

    // Focus event handler - prevent triggering on initial page load
    const focusHandler = useCallback(() => {
        // Don't trigger session update on initial page load (first 10 seconds)
        const timeSinceLoad = Date.now() - pageLoadTimeRef.current;
        if (timeSinceLoad < 10000 && !hasHandledInitialFocusRef.current) {
            hasHandledInitialFocusRef.current = true;
            return; // Skip first focus event on page load
        }
        handleUserActivity();
    }, [handleUserActivity]);

    useEffect(() => {
        if (!session || !currentSessionId) return;

        // Throttled handler for high-frequency events (mousemove, scroll)
        const throttledHandler = () => {
            if (throttleTimeoutRef.current) return;
            throttleTimeoutRef.current = setTimeout(() => {
                handleUserActivity();
                throttleTimeoutRef.current = null;
            }, 60000); // Throttle to once per minute for high-frequency events
        };

        // Delayed handler for click events - prevent immediate update on first click
        const clickHandler = () => {
            // On first click after page load, delay the session update significantly
            if (!hasInitializedRef.current) {
                hasInitializedRef.current = true;
                // Don't update session on the very first click - wait for subsequent interactions
                return;
            }
            
            if (clickThrottleRef.current) return;
            // Delay session update to prevent re-render on first few clicks
            clickThrottleRef.current = setTimeout(() => {
                handleUserActivity();
                clickThrottleRef.current = null;
            }, 5000); // Wait 5 seconds before updating session after first click
        };
        
        // High-frequency events - use throttled handler
        window.addEventListener('mousemove', throttledHandler, { passive: true });
        window.addEventListener('scroll', throttledHandler, { passive: true });

        // Click events - use delayed handler to prevent immediate re-renders
        window.addEventListener('mousedown', clickHandler, { passive: true });
        window.addEventListener('click', clickHandler, { passive: true });
        window.addEventListener('touchstart', clickHandler, { passive: true });
        
        // Other low-frequency events - use direct handler (but still throttled by handleUserActivity)
        window.addEventListener('keypress', handleUserActivity, { passive: true });
        
        // Focus event - prevent triggering on initial page load
        window.addEventListener('focus', focusHandler, { passive: true });

        // Also refresh periodically (every 10 minutes) if user is active
        // But wait at least 30 seconds after page load before first periodic refresh
        const initialDelay = Math.max(0, 30000 - (Date.now() - pageLoadTimeRef.current));
        refreshIntervalRef.current = setTimeout(() => {
            refreshIntervalRef.current = setInterval(() => {
                if (document.hasFocus()) {
                    handleUserActivity();
                }
            }, 10 * 60 * 1000); // 10 minutes
        }, initialDelay);

        return () => {
            window.removeEventListener('mousemove', throttledHandler);
            window.removeEventListener('scroll', throttledHandler);
            window.removeEventListener('mousedown', clickHandler);
            window.removeEventListener('click', clickHandler);
            window.removeEventListener('touchstart', clickHandler);
            window.removeEventListener('keypress', handleUserActivity);
            window.removeEventListener('focus', focusHandler);
            
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }
            if (clickThrottleRef.current) {
                clearTimeout(clickThrottleRef.current);
            }
            if (refreshIntervalRef.current) {
                if (typeof refreshIntervalRef.current === 'number') {
                    clearTimeout(refreshIntervalRef.current);
                } else {
                    clearInterval(refreshIntervalRef.current);
                }
            }
        };
    }, [currentSessionId, handleUserActivity, focusHandler]); // Only depend on session ID, not entire session object

    return null; // This component doesn't render anything
}
