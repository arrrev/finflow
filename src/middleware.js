export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        "/",
        "/planning/:path*",
        "/transactions/:path*",
        "/profile/:path*",
        "/settings/:path*"
    ]
}
