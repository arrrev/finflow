import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new NextResponse("Invalid request: ids array is required", { status: 400 });
        }

        // Build placeholders for SQL IN clause ($1, $2, $3, etc.)
        const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');

        // Get transactions before deleting to update account balances
        const txRes = await query(
            `SELECT account_id, amount 
             FROM transactions 
             WHERE id IN (${placeholders}) 
             AND user_email = $1`,
            [session.user.email, ...ids]
        );

        // Delete transactions that belong to the user
        const result = await query(
            `DELETE FROM transactions 
             WHERE id IN (${placeholders}) 
             AND user_email = $1
             RETURNING id`,
            [session.user.email, ...ids]
        );

        // Update account balances (group by account_id)
        const balanceUpdates = new Map();
        txRes.rows.forEach(row => {
            if (row.account_id) {
                const current = balanceUpdates.get(row.account_id) || 0;
                balanceUpdates.set(row.account_id, current - parseFloat(row.amount || 0));
            }
        });

        // Update each account balance
        await Promise.all(Array.from(balanceUpdates.entries()).map(([accountId, amountChange]) =>
            query(`
                UPDATE accounts 
                SET balance = COALESCE(balance, 0) + $1
                WHERE id = $2
            `, [amountChange, accountId])
        ));

        return NextResponse.json({
            success: true,
            deleted: result.rows.length,
            message: `${result.rows.length} transaction(s) deleted successfully`
        });

    } catch (error) {
        console.error("Bulk delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
