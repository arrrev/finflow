import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { verifyOTP } from "@/lib/email";

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { current, newPass, otpCode } = await request.json();

        if (!newPass) return new NextResponse("New password is required", { status: 400 });
        if (newPass.length < 8) return new NextResponse("Password must be at least 8 characters", { status: 400 });

        // Get user hash and email
        const res = await query('SELECT password_hash, email FROM users WHERE id = $1', [session.user.id]);
        if (res.rowCount === 0) return new NextResponse("User not found", { status: 404 });

        const user = res.rows[0];

        // If OTP code is provided, verify it instead of current password
        if (otpCode) {
            const isValid = await verifyOTP(user.email, otpCode, 'RESET');
            if (!isValid) {
                return new NextResponse("Invalid or expired verification code", { status: 400 });
            }
        } else {
            // Otherwise, verify current password if user HAS a password
            if (user.password_hash) {
                if (!current) return new NextResponse("Current password or verification code required", { status: 400 });
                const match = await compare(current, user.password_hash);
                if (!match) return new NextResponse("Incorrect current password", { status: 400 });
            }
        }

        // Hash new password
        const hashed = await hash(newPass, 10);

        // Update
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, session.user.id]);

        return new NextResponse("Password updated", { status: 200 });
    } catch (error) {
        console.error("Password update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
