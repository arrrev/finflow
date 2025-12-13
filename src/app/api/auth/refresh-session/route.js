import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * API endpoint to refresh/prolong the session
 * This endpoint validates the session and returns success
 * The actual session prolongation happens via NextAuth's update() method on the client
 */
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Session is valid, client should call session.update() to prolong
        return NextResponse.json({ 
            success: true, 
            message: "Session is valid" 
        });
    } catch (error) {
        console.error("Error checking session:", error);
        return NextResponse.json(
            { error: "Failed to check session" },
            { status: 500 }
        );
    }
}

