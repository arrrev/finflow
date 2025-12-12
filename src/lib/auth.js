import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

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
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null;

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
                        image: user.image_url
                    };
                }
                return null;
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
                            `INSERT INTO users (email, first_name, last_name, image_url, password_hash) 
                             VALUES ($1, $2, $3, $4, NULL) 
                             RETURNING id, email, first_name, last_name, image_url`,
                            [
                                user.email,
                                profile.given_name || user.name.split(' ')[0],
                                profile.family_name || user.name.split(' ').slice(1).join(' '),
                                user.image
                            ]
                        );
                        // Attach ID to user object so it propagates to jwt callback
                        user.id = newUser.rows[0].id.toString();
                        user.firstName = newUser.rows[0].first_name;
                        user.lastName = newUser.rows[0].last_name;
                    } else {
                        // User exists, just ensure we have the ID for the session
                        const existingUser = res.rows[0];
                        user.id = existingUser.id.toString();
                        user.firstName = existingUser.first_name;
                        user.lastName = existingUser.last_name;
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
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (trigger === "update" && session) {
                const { image, ...sessionWithoutImage } = session;
                return { ...token, ...sessionWithoutImage };
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "supersecret",
    debug: true,
    trustHost: true,
};
