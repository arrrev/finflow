import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const res = await query(`
            SELECT * FROM accounts
            WHERE user_id = $1 OR user_id IS NULL
            ORDER BY name ASC
        `, [session.user.id]);

        // Get transaction counts
        const txCountsRes = await query(`
            SELECT account_name, 
                   COUNT(*) as count,
                   SUM(amount) as balance
            FROM transactions
            WHERE user_email = $1
            GROUP BY account_name
        `, [session.user.email]);

        const txData = {};
        txCountsRes.rows.forEach(r => {
            txData[r.account_name] = {
                count: parseInt(r.count),
                balance: parseFloat(r.balance)
            };
        });

        const result = res.rows.map(acc => ({
            ...acc,
            tx_count: txData[acc.name]?.count || 0,
            balance_amd: txData[acc.name]?.balance || 0
        }));

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
        const { name, color, default_currency, ordering } = body;

        const res = await query(`
            INSERT INTO accounts (user_id, name, color, default_currency, ordering)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [session.user.id, name, color || '#fbbf24', default_currency || 'AMD', ordering || 0]);

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
        const { id, name, color, default_currency, ordering } = body;

        const verify = await query('SELECT id, name FROM accounts WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        const oldName = verify.rows[0].name;

        // If name changed, update transactions that reference this account
        if (oldName !== name) {
            await query(`
                UPDATE transactions 
                SET account_name = $1 
                WHERE user_email = $2 AND account_name = $3
            `, [name, session.user.email, oldName]);
        }

        const res = await query(`
            UPDATE accounts 
            SET name = $1, color = $2, default_currency = $3, ordering = $4
            WHERE id = $5
            RETURNING *
        `, [name, color, default_currency, ordering, id]);

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

        // 1. Get Account Name
        const accRes = await query('SELECT name FROM accounts WHERE id=$1 AND (user_id=$2 OR user_id IS NULL)', [id, session.user.id]);
        if (accRes.rowCount === 0) return new NextResponse("Not found", { status: 404 });
        const accName = accRes.rows[0].name;

        // 2. Check Transactions
        const txCheck = await query('SELECT id FROM transactions WHERE user_email=$1 AND account_name=$2 LIMIT 1', [session.user.email, accName]);
        if (txCheck.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Cannot delete: Transactions exist with this account." }), { status: 409 });
        }

        await query('DELETE FROM accounts WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Account delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
