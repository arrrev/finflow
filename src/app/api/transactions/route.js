import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { convertCurrency } from "@/lib/exchangeRates";

// Basic GET for listing transactions
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    
    // Session prolongation is handled client-side via session.update()

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category_id = searchParams.get("category_id");
    const subcategory_id = searchParams.get("subcategory_id");
    const account_id = searchParams.get("account_id");

    try {
        let queryStr = `
            SELECT t.*, 
                   s.name as subcategory_name,
                   c.name as category_name,
                   c.color as category_color,
                   a.name as account_name,
                   a.color as account_color
            FROM transactions t
            LEFT JOIN subcategories s ON t.subcategory_id = s.id
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN accounts a ON t.account_id = a.id
            WHERE t.user_email = $1
        `;

        const params = [session.user.email];
        let paramIdx = 2;

        if (from) {
            queryStr += ` AND t.created_at >= $${paramIdx}`;
            params.push(from);
            paramIdx++;
        }
        if (to) {
            queryStr += ` AND t.created_at <= $${paramIdx}`;
            params.push(to + ' 23:59:59'); // Inclusive of end date
            paramIdx++;
        }
        if (category_id) {
            queryStr += ` AND t.category_id = ANY($${paramIdx}::int[])`;
            params.push(category_id.split(','));
            paramIdx++;
        }
        if (subcategory_id) {
            queryStr += ` AND t.subcategory_id = ANY($${paramIdx}::int[])`;
            params.push(subcategory_id.split(','));
            paramIdx++;
        }
        if (account_id) {
            queryStr += ` AND t.account_id = ANY($${paramIdx}::int[])`;
            params.push(account_id.split(','));
            paramIdx++;
        }

        queryStr += ` ORDER BY t.id DESC LIMIT 500`;

        const res = await query(queryStr, params);

        return NextResponse.json(res.rows);
    } catch (error) {
        console.error("Transactions fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await request.json();
        const { amount, currency, category_id, account_id, note, subcategory_id, date } = body;

        // Basic validation
        if (!amount || !category_id || !account_id) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get account to determine its currency
        const accountRes = await query(
            'SELECT default_currency FROM accounts WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
            [account_id, session.user.email]
        );

        if (accountRes.rows.length === 0) {
            return new NextResponse("Account not found", { status: 404 });
        }

        const accountCurrency = accountRes.rows[0].default_currency || 'USD';
        const transactionCurrency = currency || accountCurrency;
        let amountNum = parseFloat(amount);

        // Store original if conversion happens (convert to AMD for unified storage)
        let originalAmount = null;
        let originalCurrency = null;
        let convertedAmount = amountNum;
        let convertedCurrency = 'AMD';

        // Convert to AMD if transaction currency is different (for unified storage)
        if (transactionCurrency !== 'AMD') {
            originalAmount = amountNum;
            originalCurrency = transactionCurrency;
            convertedAmount = await convertCurrency(amountNum, transactionCurrency, 'AMD');
            convertedCurrency = 'AMD';
        }

        const insertQuery = `
      INSERT INTO transactions (user_email, amount, currency, category_id, account_id, note, subcategory_id, original_amount, original_currency, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

        await query(insertQuery, [
            session.user.email,
            convertedAmount,
            convertedCurrency,
            category_id,
            account_id,
            note || "",
            subcategory_id || null,
            originalAmount,
            originalCurrency,
            date || new Date() // Use provided date or current time
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transaction error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, amount, currency, category_id, account_id, note, subcategory_id, date, created_at } = body;

        if (!id || !amount) return new NextResponse("Missing required fields", { status: 400 });

        // Verify ownership
        const verify = await query('SELECT id FROM transactions WHERE id=$1 AND user_email=$2', [id, session.user.email]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        // Get account currency
        const accountRes = await query(
            'SELECT default_currency FROM accounts WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)',
            [account_id, session.user.email]
        );

        if (accountRes.rows.length === 0) {
            return new NextResponse("Account not found", { status: 404 });
        }

        const accountCurrency = accountRes.rows[0].default_currency || 'USD';
        const transactionCurrency = currency || accountCurrency;
        let amountNum = parseFloat(amount);

        // Store original if conversion happens (convert to AMD for unified storage)
        let originalAmount = null;
        let originalCurrency = null;
        let convertedAmount = amountNum;
        let convertedCurrency = 'AMD';

        // Convert to AMD if transaction currency is different
        if (transactionCurrency !== 'AMD') {
            originalAmount = amountNum;
            originalCurrency = transactionCurrency;
            convertedAmount = await convertCurrency(amountNum, transactionCurrency, 'AMD');
            convertedCurrency = 'AMD';
        }

        const queryStr = `
            UPDATE transactions
            SET amount = $1,
                currency = $2,
                category_id = $3,
                account_id = $4,
                note = $5,
                subcategory_id = $6,
                original_amount = $7,
                original_currency = $8,
                created_at = $9
            WHERE id = $10 AND user_email = $11
            RETURNING *
        `;

        const res = await query(queryStr, [
            convertedAmount || amountNum,
            convertedCurrency || 'AMD',
            category_id,
            account_id,
            note || "",
            subcategory_id || null,
            originalAmount,
            originalCurrency,
            date || created_at,
            id,
            session.user.email
        ]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Transaction update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return new NextResponse("Missing ID", { status: 400 });

        await query('DELETE FROM transactions WHERE id = $1 AND user_email = $2', [id, session.user.email]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transaction delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
