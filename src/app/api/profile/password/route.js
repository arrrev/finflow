import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { current, newPass } = await request.json();

        // Get user hash
        const res = await query('SELECT password_hash FROM users WHERE id = $1', [session.user.id]);
        if (res.rowCount === 0) return new NextResponse("User not found", { status: 404 });

        const user = res.rows[0];

        // Verify current
        const match = await compare(current, user.password_hash);
        if (!match) return new NextResponse("Incorrect current password", { status: 400 });

        // Hash new
        const hashed = await hash(newPass, 10);

        // Update
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, session.user.id]);

        return new NextResponse("Password updated", { status: 200 });
    } catch (error) {
        console.error("Password update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
