import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// Basic GET for listing transactions
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const res = await query(`
            SELECT * FROM accounts
            WHERE user_id = $1 AND deleted_at IS NULL
            ORDER BY ordering ASC, name ASC
        `, [session.user.id]);

        // Get transaction counts (Optional: exclude deleted accounts' transactions? No, history is history)
        const txCountsRes = await query(`
            SELECT account_id, 
                   COUNT(*) as count,
                   SUM(amount) as balance
            FROM transactions
            WHERE user_email = $1
            GROUP BY account_id
        `, [session.user.email]);

        const txData = {};
        txCountsRes.rows.forEach(r => {
            txData[r.account_id] = {
                count: parseInt(r.count),
                balance: parseFloat(r.balance)
            };
        });

        const result = res.rows.map(acc => {
            const initial = parseFloat(acc.initial_balance || 0);
            const txBalance = txData[acc.id]?.balance || 0;
            return {
                ...acc,
                tx_count: txData[acc.id]?.count || 0,
                balance_amd: initial + txBalance,
                initial_balance: initial // Explicitly ensure it's a number
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Accounts fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { name, color, default_currency, ordering, initial_balance } = body;

        // Check for duplicate active account
        const check = await query(`
            SELECT id FROM accounts 
            WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL
        `, [session.user.id, name]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Account with this name already exists." }), { status: 409 });
        }

        const res = await query(`
            INSERT INTO accounts (user_id, name, color, default_currency, ordering, initial_balance)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            session.user.id,
            name,
            color || '#fbbf24',
            default_currency || 'AMD',
            ordering || 0,
            initial_balance || 0
        ]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Account create error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, name, color, default_currency, ordering, initial_balance } = body;

        const verify = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        // Uniqueness check for rename
        const check = await query(`
            SELECT id FROM accounts 
            WHERE user_id = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL
        `, [session.user.id, name, id]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Account with this name already exists." }), { status: 409 });
        }

        const res = await query(`
            UPDATE accounts 
            SET name = $1, color = $2, default_currency = $3, ordering = $4, initial_balance = $5
            WHERE id = $6
            RETURNING *
        `, [
            name,
            color,
            default_currency,
            ordering,
            initial_balance || 0,
            id
        ]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Account update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        // Soft Delete
        await query('UPDATE accounts SET deleted_at = NOW() WHERE id = $1 AND user_id = $2', [id, session.user.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Account delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
