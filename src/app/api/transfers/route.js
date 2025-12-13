import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { fromAccountId, toAccountId, amount, toAmount, date } = body;

        if (!fromAccountId || !toAccountId || !amount || !toAmount) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Helper to get Account Name for notes - only user's own accounts
        const accRes = await query(
            'SELECT id, name, default_currency FROM accounts WHERE id = ANY($1) AND user_id = $2 AND deleted_at IS NULL',
            [[fromAccountId, toAccountId], session.user.id]
        );

        if (accRes.rows.length < 2 && fromAccountId !== toAccountId) {
            // Ideally should find both. Since we block same account, we expect 2.
            // But if user owns them, it's fine.
        }

        const fromAcc = accRes.rows.find(a => a.id == fromAccountId);
        const toAcc = accRes.rows.find(a => a.id == toAccountId);

        if (!fromAcc || !toAcc) {
            return new NextResponse("Invalid Accounts", { status: 400 });
        }

        // Find or Create "Transfer" Category
        let catRes = await query(
            "SELECT id FROM categories WHERE user_id = $1 AND name = 'Transfer' AND deleted_at IS NULL LIMIT 1",
            [session.user.id]
        );

        let categoryId;
        if (catRes.rows.length > 0) {
            categoryId = catRes.rows[0].id;
        } else {
            const newCat = await query(
                "INSERT INTO categories (user_id, name, color, include_in_chart) VALUES ($1, 'Transfer', '#888888', false) RETURNING id",
                [session.user.id]
            );
            categoryId = newCat.rows[0].id;
        }

        // Withdraw from Source
        // Amount should be negative for withdrawal
        const fromAmount = -Math.abs(parseFloat(amount));
        await query(
            `INSERT INTO transactions 
            (user_email, amount, currency, category_id, account_id, note, created_at, original_amount, original_currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                session.user.email,
                fromAmount,
                fromAcc.default_currency || 'AMD',
                categoryId,
                fromAcc.id,
                `Transfer to ${toAcc.name}`,
                date || new Date(),
                null,
                null
            ]
        );

        // Deposit to Target
        // Amount should be positive for deposit
        const toAmountVal = Math.abs(parseFloat(toAmount));
        await query(
            `INSERT INTO transactions 
            (user_email, amount, currency, category_id, account_id, note, created_at, original_amount, original_currency)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                session.user.email,
                toAmountVal,
                toAcc.default_currency || 'AMD',
                categoryId,
                toAcc.id,
                `Transfer from ${fromAcc.name}`,
                date || new Date(),
                null,
                null
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transfer error:", error);
        return new NextResponse("Internal Error: " + error.message, { status: 500 });
    }
}
