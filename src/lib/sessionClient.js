"use client";
import { useSession } from "next-auth/react";

/**
 * Client-side utility to refresh/prolong the session
 * Call this function on user actions to prolong the session
 */
export async function refreshSession() {
    try {
        const response = await fetch("/api/auth/refresh-session", {
            method: "POST",
            credentials: "include",
        });
        
        if (!response.ok) {
            console.error("Failed to refresh session");
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error refreshing session:", error);
        return false;
    }
}

/**
 * React hook to automatically refresh session on user activity
 * Use this in components where user actions should prolong the session
 */
export function useSessionRefresh() {
    const { data: session, update } = useSession();
    
    const refresh = async () => {
        if (session) {
            // Use NextAuth's update method to trigger JWT callback
            await update({ prolongSession: true });
        }
    };
    
    return { refresh };
}


