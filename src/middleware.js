import { withAuth } from "next-auth/middleware";

export default withAuth;

export const config = {
    matcher: [
        "/",
        "/planning/:path*",
        "/transactions/:path*",
        "/profile/:path*",
        "/settings/:path*"
    ]
}
