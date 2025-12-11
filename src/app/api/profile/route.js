import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const res = await query(`
            SELECT first_name, last_name, image_url, email 
            FROM users 
            WHERE email = $1
        `, [session.user.email]);

        if (res.rows.length === 0) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Profile fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { firstName, lastName, imageUrl } = body;

        await query(`
            UPDATE users 
            SET first_name = $1, last_name = $2, image_url = $3
            WHERE email = $4
        `, [firstName, lastName, imageUrl, session.user.email]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Profile update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
