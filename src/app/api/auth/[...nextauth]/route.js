import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export async function GET(req, res) {
    return handler(req, res);
}

export async function POST(req, res) {
    return handler(req, res);
}
