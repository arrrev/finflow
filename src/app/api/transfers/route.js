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
            'SELECT id, name, default_currency FROM accounts WHERE id = ANY($1) AND user_id = $2',
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
            "SELECT id FROM categories WHERE user_id = $1 AND name = 'Transfer' LIMIT 1",
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

        // Handle date: if date string is provided (YYYY-MM-DD), combine with current time
        let transferDate;
        if (date) {
            // If date is a string in YYYY-MM-DD format, combine with current time in local timezone
            if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
                const now = new Date();
                // Parse the date components to avoid UTC interpretation
                const [year, month, day] = date.split('-').map(Number);
                // Create date in local timezone with current time
                transferDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                // Date string with time or Date object - parse it
                transferDate = new Date(date);
            }
        } else {
            // No date provided, use current time
            transferDate = new Date();
        }

        // Withdraw from Source
        // Amount should be negative for withdrawal
        const fromAmount = -Math.abs(parseFloat(amount));
        await query(
            `INSERT INTO transactions 
            (user_id, amount, currency, category_id, account_id, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                session.user.id,
                fromAmount,
                fromAcc.default_currency || 'USD',
                categoryId,
                fromAcc.id,
                `Transfer to ${toAcc.name}`,
                transferDate
            ]
        );

        // Deposit to Target
        // Amount should be positive for deposit
        const toAmountVal = Math.abs(parseFloat(toAmount));
        await query(
            `INSERT INTO transactions 
            (user_id, amount, currency, category_id, account_id, note, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                session.user.id,
                toAmountVal,
                toAcc.default_currency || 'USD',
                categoryId,
                toAcc.id,
                `Transfer from ${fromAcc.name}`,
                transferDate
            ]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transfer error:", error);
        return new NextResponse("Internal Error: " + error.message, { status: 500 });
    }
}
