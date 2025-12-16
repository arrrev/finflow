import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Works for both regular login and Google login users
        const userId = session.user.id;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
        }

        // Check if user has any accounts
        const accountsRes = await query(
            `SELECT COUNT(*) as count FROM accounts 
             WHERE user_id = $1`,
            [userId]
        );
        const accountCount = parseInt(accountsRes.rows[0].count);

        // Check if user has any categories
        const categoriesRes = await query(
            `SELECT COUNT(*) as count FROM categories 
             WHERE user_id = $1`,
            [userId]
        );
        const categoryCount = parseInt(categoriesRes.rows[0].count);

        // Check if user has any transactions
        const transactionsRes = await query(
            `SELECT COUNT(*) as count FROM transactions 
             WHERE user_email = $1`,
            [session.user.email]
        );
        const transactionCount = parseInt(transactionsRes.rows[0].count);

        // Show wizard only if user has NO transactions AND NO accounts AND NO categories
        // If user has at least one transaction OR category OR account, do not show the wizard
        const hasNoActivity = transactionCount === 0 && accountCount === 0 && categoryCount === 0;

        return NextResponse.json({ 
            hasNoActivity,
            accountCount,
            categoryCount,
            transactionCount
        });
    } catch (error) {
        console.error('Activity check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

