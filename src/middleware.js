import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req });
    const path = req.nextUrl.pathname;

    // 1. Guest Routes (Sign In, Register): Redirect to Dashboard if logged in
    if (path.startsWith("/auth/signin") || path.startsWith("/register")) {
        if (token) {
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

    return NextResponse.next();
}

export const config = {
    matcher: [
        /* Protected Routes */
        "/",
        "/planning/:path*",
        "/transactions/:path*",
        "/profile/:path*",
        "/settings/:path*",

        /* Guest Routes */
        "/auth/signin",
        "/register"
    ]
}
