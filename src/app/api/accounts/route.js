import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchangeRates";
import { getUserMainCurrency } from "@/lib/userPreferences";

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

        // Get current exchange rates for conversion
        const { convertCurrency } = await import('@/lib/exchangeRates');

        // Get transaction counts
        const txCountsRes = await query(`
            SELECT account_id, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1
            GROUP BY account_id
        `, [session.user.email]);

        const txCounts = {};
        txCountsRes.rows.forEach(r => {
            txCounts[r.account_id] = parseInt(r.count);
        });

        // Calculate balances for each account
        const result = await Promise.all(res.rows.map(async (acc) => {
            const initialOriginal = parseFloat(acc.initial_balance || 0);
            const accountCurrency = acc.default_currency || 'USD';

            // Get all transactions for this account
            const txRes = await query(`
                SELECT original_amount, original_currency, amount, currency
                FROM transactions
                WHERE account_id = $1 AND user_email = $2
            `, [acc.id, session.user.email]);

            // Sum transaction amounts in account's currency
            let txBalance = 0;
            for (const row of txRes.rows) {
                const txAmount = parseFloat(row.amount || 0);
                const txCurrency = row.currency || accountCurrency;
                const txOriginalAmount = row.original_amount ? parseFloat(row.original_amount) : null;
                const txOriginalCurrency = row.original_currency;

                // Transactions are stored in account currency, so if currency matches, use amount directly
                if (txCurrency === accountCurrency) {
                    txBalance += txAmount;
                }
                // If transaction has original currency that matches account currency, use original amount
                else if (txOriginalCurrency && txOriginalCurrency === accountCurrency && txOriginalAmount !== null) {
                    txBalance += txOriginalAmount;
                }
                // Otherwise, convert from transaction currency to account currency
                else {
                    const converted = await convertCurrency(txAmount, txCurrency, accountCurrency);
                    txBalance += converted;
                }
            }

            // Balance in account's original currency
            const balanceOriginal = initialOriginal + txBalance;

            return {
                ...acc,
                tx_count: txCounts[acc.id] || 0,
                balance_native: balanceOriginal, // Balance in account's native currency
                initial_balance: initialOriginal // Keep in original currency
            };
        }));

        // Get user's main currency and convert all balances for summary
        const userMainCurrency = await getUserMainCurrency(session.user.id);
        
        const resultWithConverted = await Promise.all(result.map(async (acc) => {
            let balanceInUserCurrency = acc.balance_native;
            if (acc.default_currency !== userMainCurrency) {
                balanceInUserCurrency = await convertCurrency(acc.balance_native, acc.default_currency, userMainCurrency);
            }

            return {
                ...acc,
                balance_user_currency: balanceInUserCurrency, // Converted to user's main currency
                userMainCurrency: userMainCurrency, // Include user's main currency for display
                // Keep balance_amd for backward compatibility (same as balance_user_currency)
                balance_amd: balanceInUserCurrency
            };
        }));

        return NextResponse.json(resultWithConverted);
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
            default_currency || 'USD',
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
            WHERE id = $7 AND user_id = $8
            RETURNING *
        `, [
            name,
            color,
            default_currency,
            ordering,
            initialBalanceOriginal,
            isAvailable,
            id,
            session.user.id
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

        // Check for usage in transactions
        const txCheck = await query(`
            SELECT COUNT(*) as count FROM transactions 
            WHERE user_email = $2 AND account_id = $1
        `, [id, session.user.email]);

        if (parseInt(txCheck.rows[0].count) > 0) {
            return new NextResponse(JSON.stringify({ error: "Cannot delete account used in transactions." }), { status: 400 });
        }

        // Hard Delete
        await query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, session.user.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Account delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
