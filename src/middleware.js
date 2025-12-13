import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req });
    const path = req.nextUrl.pathname;

    // 1. Public Routes (accessible to everyone)
    const publicRoutes = ["/auth/signin", "/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify", "/how-it-works"];
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
    
    // 1. Guest Routes (Sign In, Register, Password Reset, Verify): Redirect to Dashboard if logged in
    const guestRoutes = ["/auth/signin", "/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify"];
    const isGuestRoute = guestRoutes.some(route => path.startsWith(route));

    // Allow public routes (like how-it-works) to be accessible to everyone
    if (isPublicRoute && !isGuestRoute) {
        return NextResponse.next();
    }

    if (isGuestRoute) {
        // Only redirect to dashboard if logged in AND it's signin/register (not password reset/verify)
        if (token && (path.startsWith("/auth/signin") || path.startsWith("/register"))) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return NextResponse.next();
    }

    // 2. Protected Routes: Redirect to Sign In if not logged in
    // Since the Matcher includes both Guest and Protected routes, 
    // and we already handled Guest routes above, anything reaching here 
    // that MATCHES the config should be a protected route.
    // However, explicit check is safer if logic changes.

    // Check if it is a protected path (all matcher paths except guest ones)
    // Actually, simply: if not guest route, and middleware ran, it's protected (based on matcher).

    if (!token) {
        const url = new URL("/auth/signin", req.url);
        url.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(url);
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
