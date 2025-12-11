import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        const res = await query('SELECT NOW()');
        const duration = Date.now() - start;
        return NextResponse.json({
            status: 'ok',
            time: res.rows[0].now,
            duration_ms: duration,
            env_check: {
                has_db_url: !!process.env.DATABASE_URL,
                has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
                node_env: process.env.NODE_ENV
            }
        });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            env_check: {
                has_db_url: !!process.env.DATABASE_URL,
                has_nextauth_secret: !!process.env.NEXTAUTH_SECRET
            }
        }, { status: 500 });
    }
}
