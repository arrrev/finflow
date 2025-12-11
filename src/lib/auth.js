import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
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
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.firstName = token.firstName;
                session.user.lastName = token.lastName;
                session.user.image = token.image;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (trigger === "update" && session) {
                // Allow client-side update of session
                // session contains the data passed to update()
                return { ...token, ...session };
            }
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.firstName = user.firstName;
                token.lastName = user.lastName;
                // Only include image if it is short (URL) not Base64 data (Blob)
                if (user.image && user.image.length < 200) {
                    token.image = user.image;
                } else {
                    token.image = null; // Too long for cookie
                }
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "supersecret",
    debug: true,
    trustHost: true,
};
