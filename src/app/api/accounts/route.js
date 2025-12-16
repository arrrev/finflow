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
            SELECT id, name, color, default_currency, initial_balance, balance, is_available
            FROM accounts
            WHERE user_id = $1
            ORDER BY name ASC
        `, [session.user.id]);

        // Early return if no accounts
        if (res.rows.length === 0) {
            return NextResponse.json([]);
        }

        // Get current exchange rates for conversion (fetch once, use for all)
        const rates = await getExchangeRates();
        const userMainCurrency = await getUserMainCurrency(session.user.id);

        // Get transaction counts (only if we have accounts)
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

        // Use stored balance from accounts table (much faster)
        const result = res.rows.map(acc => {
            const initialOriginal = parseFloat(acc.initial_balance || 0);
            const storedBalance = parseFloat(acc.balance || 0);
            
            // Balance in account's native currency (stored balance already includes initial + transactions)
            const balanceOriginal = storedBalance;

            // Convert to user's main currency synchronously (using pre-fetched rates)
            let balanceInUserCurrency = balanceOriginal;
            if (acc.default_currency !== userMainCurrency && rates[acc.default_currency] && rates[userMainCurrency]) {
                const amountInUSD = balanceOriginal / rates[acc.default_currency];
                balanceInUserCurrency = amountInUSD * rates[userMainCurrency];
            }

            return {
                ...acc,
                tx_count: txCounts[acc.id] || 0,
                balance_native: balanceOriginal, // Balance in account's native currency
                initial_balance: initialOriginal, // Keep in original currency
                balance_user_currency: balanceInUserCurrency, // Converted to user's main currency
                userMainCurrency: userMainCurrency, // Include user's main currency for display
                balance_amd: balanceInUserCurrency // Backward compatibility
            };
        });

        return NextResponse.json(result, {
            headers: {
                'Cache-Control': 'private, max-age=60' // Cache for 60 seconds (accounts change less frequently)
            }
        });
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
        const { name, color, default_currency, initial_balance, is_available } = body;

        // Store initial_balance in the original currency (no conversion)
        // Conversion happens only when displaying total balance in AMD
        const initialBalanceOriginal = parseFloat(initial_balance) || 0;
        const isAvailable = is_available !== undefined ? is_available : true;

        // Check for duplicate active account
        const check = await query(`
            SELECT id FROM accounts 
            WHERE user_id = $1 AND name = $2
        `, [session.user.id, name]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Account with this name already exists." }), { status: 409 });
        }

        const res = await query(`
            INSERT INTO accounts (user_id, name, color, default_currency, initial_balance, balance, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            session.user.id,
            name,
            color || '#fbbf24',
            default_currency || 'USD',
            initialBalanceOriginal,
            initialBalanceOriginal, // Set balance = initial_balance for new accounts
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
        const { id, name, color, default_currency, initial_balance, is_available } = body;

        const verify = await query('SELECT id FROM accounts WHERE id = $1 AND user_id = $2', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        // Store initial_balance in the original currency (no conversion)
        const initialBalanceOriginal = parseFloat(initial_balance) || 0;
        const isAvailable = is_available !== undefined ? is_available : true;

        // Uniqueness check for rename
        const check = await query(`
            SELECT id FROM accounts 
            WHERE user_id = $1 AND name = $2 AND id != $3
        `, [session.user.id, name, id]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Account with this name already exists." }), { status: 409 });
        }

        // Get old account to calculate balance adjustment
        const oldAccRes = await query('SELECT initial_balance, balance FROM accounts WHERE id = $1', [id]);
        const oldInitialBalance = parseFloat(oldAccRes.rows[0]?.initial_balance || 0);
        const oldBalance = parseFloat(oldAccRes.rows[0]?.balance || 0);
        
        // Calculate transaction sum (balance - initial_balance)
        const oldTxSum = oldBalance - oldInitialBalance;
        
        // New balance = new initial_balance + transaction sum
        const newBalance = initialBalanceOriginal + oldTxSum;

        const res = await query(`
            UPDATE accounts 
            SET name = $1, color = $2, default_currency = $3, initial_balance = $4, balance = $5, is_available = $6
            WHERE id = $7 AND user_id = $8
            RETURNING *
        `, [
            name,
            color,
            default_currency,
            initialBalanceOriginal,
            newBalance,
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
