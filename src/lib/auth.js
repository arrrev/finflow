import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { initializeUser } from "@/lib/user_setup";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                rememberMe: { label: "Remember Me", type: "text" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const res = await query(
                        `SELECT * FROM users WHERE email = $1`,
                        [credentials.email]
                    );

                    if (res.rows.length === 0) return null;

                    const user = res.rows[0];
                    if (!user.password_hash) return null; // Prevent password login if no password set (Google account)

                    const isValid = await bcrypt.compare(credentials.password, user.password_hash);

                    if (isValid) {
                        return {
                            id: user.id.toString(),
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            image: user.image_url,
                            emailVerified: user.email_verified || false,
                            rememberMe: credentials.rememberMe === 'true' || credentials.rememberMe === true
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Auth authorize error:', error);
                    // Return null on error to prevent exposing database issues
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === 'google') {
                try {
                    const res = await query('SELECT * FROM users WHERE email = $1', [user.email]);

                    if (res.rows.length === 0) {
                        // Create new user
                        const newUser = await query(
                            `INSERT INTO users (email, first_name, last_name, image_url, password_hash, email_verified) 
                             VALUES ($1, $2, $3, $4, NULL, TRUE) 
                             RETURNING id, email, first_name, last_name, image_url, email_verified`,
                            [
                                user.email,
                                profile.given_name || user.name.split(' ')[0],
                                profile.family_name || user.name.split(' ').slice(1).join(' '),
                                user.image
                            ]
                        );

                        const userId = newUser.rows[0].id;

                        // Initialize default data
                        await initializeUser(userId);

                        // Attach ID to user object so it propagates to jwt callback
                        user.id = newUser.rows[0].id.toString();
                        user.firstName = newUser.rows[0].first_name;
                        user.lastName = newUser.rows[0].last_name;
                        user.emailVerified = newUser.rows[0].email_verified || false;
                        user.rememberMe = true; // Default to true for Google sign-in
                    } else {
                        // User exists, just ensure we have the ID for the session
                        const existingUser = res.rows[0];
                        user.id = existingUser.id.toString();
                        user.firstName = existingUser.first_name;
                        user.lastName = existingUser.last_name;
                        user.emailVerified = existingUser.email_verified || false;
                        user.rememberMe = true; // Default to true for Google sign-in
                    }
                    return true;
                } catch (error) {
                    console.error("Google Sign-in Error:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.emailVerified = token.emailVerified || false;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (trigger === "update" && session) {
                const { image, ...sessionWithoutImage } = session;
                // If session update includes prolongSession flag, extend expiration
                if (session.prolongSession) {
                    const rememberMe = token.rememberMe || false;
                    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
                    token.exp = Math.floor(Date.now() / 1000) + maxAge;
                }
                // Update emailVerified if provided in session update
                if (session.emailVerified !== undefined) {
                    token.emailVerified = session.emailVerified;
                }
                return { ...token, ...sessionWithoutImage };
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                token.emailVerified = user.emailVerified || false;
                token.rememberMe = user.rememberMe || false;
                // Set maxAge based on rememberMe: 30 days (2592000 seconds) or 2 hours (7200 seconds)
                token.maxAge = user.rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
                token.exp = Math.floor(Date.now() / 1000) + token.maxAge;
            } else if (token && token.exp) {
                // Refresh email_verified status from database on token refresh
                if (token.email) {
                    try {
                        const res = await query('SELECT email_verified FROM users WHERE email = $1', [token.email]);
                        if (res.rows.length > 0) {
                            token.emailVerified = res.rows[0].email_verified || false;
                        }
                    } catch (error) {
                        console.error('Error refreshing email_verified status:', error);
                    }
                }
                // On token refresh, check if we should extend the session
                // If token is still valid and user is active, extend it
                const now = Math.floor(Date.now() / 1000);
                const timeUntilExpiry = token.exp - now;
                const rememberMe = token.rememberMe || false;
                const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60;
                
                // If token expires in less than 10% of maxAge, extend it
                // This ensures sessions are prolonged on user activity
                if (timeUntilExpiry < maxAge * 0.1 && timeUntilExpiry > 0) {
                    token.exp = now + maxAge;
                }
            }
            return token;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // Default 30 days, but actual maxAge is set in JWT callback
    },
    secret: process.env.NEXTAUTH_SECRET || "supersecret",
    debug: true,
    trustHost: true,
};
