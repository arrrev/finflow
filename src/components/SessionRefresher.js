"use client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Component that automatically refreshes the session on user activity
 * This prolongs the session expiration when users interact with the app
 */
export default function SessionRefresher() {
    const { data: session, update } = useSession();
    const lastRefreshRef = useRef(0);
    const refreshIntervalRef = useRef(null);

    useEffect(() => {
        if (!session) return;

        // Refresh session on user activity (mouse move, click, keypress, scroll)
        const handleUserActivity = () => {
            const now = Date.now();
            // Only refresh if at least 5 minutes have passed since last refresh
            // This prevents too frequent refreshes
            if (now - lastRefreshRef.current > 5 * 60 * 1000) {
                update({ prolongSession: true });
                lastRefreshRef.current = now;
            }
        };

        // Set up event listeners for user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity, { passive: true });
        });

        // Also refresh periodically (every 10 minutes) if user is active
        refreshIntervalRef.current = setInterval(() => {
            if (document.hasFocus()) {
                handleUserActivity();
            }
        }, 10 * 60 * 1000); // 10 minutes

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [session, update]);

    return null; // This component doesn't render anything
}


