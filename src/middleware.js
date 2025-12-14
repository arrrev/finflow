import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req });
    const path = req.nextUrl.pathname;

    // 1. Public Routes (accessible to everyone)
    const publicRoutes = ["/auth/signin", "/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify", "/how-it-works", "/privacy-policy", "/terms-and-conditions"];
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
    
    // 1. Guest Routes (Sign In, Register, Password Reset, Verify): Redirect to Dashboard if logged in
    const guestRoutes = ["/auth/signin", "/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify"];
    const isGuestRoute = guestRoutes.some(route => path.startsWith(route));

    // Allow public routes (like how-it-works) to be accessible to everyone
    if (isPublicRoute && !isGuestRoute) {
        return NextResponse.next();
    }

    if (isGuestRoute) {
        // Allow access to guest routes regardless of verification status
        // Only redirect to dashboard if logged in AND verified AND it's signin/register (not password reset/verify)
        if (token && token.emailVerified && (path.startsWith("/auth/signin") || path.startsWith("/register"))) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        // Always allow access to guest routes (signin, verify, etc.) even if not verified
        return NextResponse.next();
    }

    // 2. Protected Routes: Redirect to Sign In if not logged in
    if (!token) {
        const url = new URL("/auth/signin", req.url);
        url.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(url);
    }

    // 3. Check email verification status
    // If email_verified is not in token (old token), assume verified to avoid blocking
    // The JWT callback will refresh it on the next request
    let emailVerified = token.emailVerified;
    
    // If email_verified is undefined (old token), allow access but it will be refreshed
    // If explicitly false, redirect to verification (but allow access to auth pages)
    if (emailVerified === false) {
        // Don't redirect if already on an auth page (signin, verify, etc.)
        const authPages = ["/auth/signin", "/auth/verify", "/auth/forgot-password", "/auth/reset-password", "/register"];
        const isOnAuthPage = authPages.some(page => path.startsWith(page));
        
        if (!isOnAuthPage) {
            const url = new URL("/auth/verify", req.url);
            url.searchParams.set("email", token.email || '');
            url.searchParams.set("type", "LOGIN");
            if (path !== '/') {
                url.searchParams.set("callbackUrl", path);
            }
            return NextResponse.redirect(url);
        }
    }

    // Session prolongation is handled in the JWT callback automatically
    // when the token is refreshed on each request

    return NextResponse.next();
}

export const config = {
    matcher: [
        /* Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)"
    ]
}
