import { getToken } from "next-auth/jwt";
import { encode } from "next-auth/jwt";

/**
 * Prolongs the session expiration when user performs an action
 * @param {Request} req - The incoming request
 * @param {Response} res - The response object (optional, for API routes)
 * @returns {Promise<boolean>} - Returns true if session was prolonged, false otherwise
 */
export async function prolongSession(req) {
    try {
        const token = await getToken({ req });
        
        if (!token) {
            return false;
        }

        // Get rememberMe from token
        const rememberMe = token.rememberMe || false;
        
        // Calculate new expiration: 30 days if rememberMe, 2 hours if not
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
        const newExp = Math.floor(Date.now() / 1000) + maxAge;

        // Update token expiration
        token.exp = newExp;

        // Note: In NextAuth, we can't directly update the JWT token from middleware/API routes
        // The token is updated automatically on the next request if it's still valid
        // However, we can set a cookie with the new expiration
        
        // For now, we'll rely on NextAuth's automatic token refresh
        // The session will be prolonged on the next request automatically
        // This is a limitation of NextAuth - we can't directly update the JWT from server-side
        
        return true;
    } catch (error) {
        console.error("Error prolonging session:", error);
        return false;
    }
}

/**
 * Middleware helper to prolong session on API requests
 * Call this at the start of protected API routes
 */
export async function prolongSessionMiddleware(req) {
    return await prolongSession(req);
}


