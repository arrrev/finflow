import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchangeRates";

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

        // Get current exchange rates for reverse conversion
        const rates = await getExchangeRates();

        // Get transaction counts and balances in original currency
        // For each account, sum only transactions that match its currency
        const txCountsRes = await query(`
            SELECT account_id, 
                   COUNT(*) as count,
                   COALESCE(SUM(CASE 
                       WHEN original_currency IS NOT NULL THEN original_amount
                       ELSE amount 
                   END), 0) as balance
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
            const initialOriginal = parseFloat(acc.initial_balance || 0);

            // Get transaction balance - already in account's currency
            // (transactions store original_amount in the account's currency)
            const txBalance = txData[acc.id]?.balance || 0;

            // Balance in account's original currency
            const balanceOriginal = initialOriginal + txBalance;

            // Convert to AMD for balance_amd field
            let balanceAMD = balanceOriginal;
            if (acc.default_currency === 'USD') {
                balanceAMD = balanceOriginal * rates.USD;
            } else if (acc.default_currency === 'EUR') {
                balanceAMD = balanceOriginal * rates.EUR;
            }

            return {
                ...acc,
                tx_count: txData[acc.id]?.count || 0,
                balance_amd: balanceAMD,
                initial_balance: initialOriginal // Keep in original currency
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
        const { name, color, default_currency, ordering, initial_balance, is_available } = body;

        // Store initial_balance in the original currency (no conversion)
        // Conversion happens only when displaying total balance in AMD
        const initialBalanceOriginal = parseFloat(initial_balance) || 0;
        const isAvailable = is_available !== undefined ? is_available : true;

        // Check for duplicate active account
        const check = await query(`
            SELECT id FROM accounts 
            WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL
        `, [session.user.id, name]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Account with this name already exists." }), { status: 409 });
        }

        const res = await query(`
            INSERT INTO accounts (user_id, name, color, default_currency, ordering, initial_balance, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            session.user.id,
            name,
            color || '#fbbf24',
            default_currency || 'AMD',
            ordering || 0,
            initialBalanceOriginal,
            isAvailable
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
        const { id, name, color, default_currency, ordering, initial_balance, is_available } = body;

        const verify = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        // Store initial_balance in the original currency (no conversion)
        const initialBalanceOriginal = parseFloat(initial_balance) || 0;
        const isAvailable = is_available !== undefined ? is_available : true;

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
            SET name = $1, color = $2, default_currency = $3, ordering = $4, initial_balance = $5, is_available = $6
            WHERE id = $7
            RETURNING *
        `, [
            name,
            color,
            default_currency,
            ordering,
            initialBalanceOriginal,
            isAvailable,
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
