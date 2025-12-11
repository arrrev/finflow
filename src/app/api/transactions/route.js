import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// Basic GET for listing transactions
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    try {
        let queryStr = `
            SELECT t.*, 
                   s.name as subcategory_name,
                   c.color as category_color,
                   a.color as account_color
            FROM transactions t
            LEFT JOIN subcategories s ON t.subcategory_id = s.id
            LEFT JOIN categories c ON t.category_name = c.name AND (c.user_id = $1 OR c.user_id IS NULL)
            LEFT JOIN accounts a ON t.account_name = a.name AND (a.user_id = $1 OR a.user_id IS NULL)
            WHERE t.user_email = $2
        `;

        const params = [session.user.id, session.user.email];
        let paramIdx = 3;

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

        queryStr += ` ORDER BY t.created_at DESC LIMIT 500`;

        const res = await query(queryStr, params);

        // Remove duplicates if left join caused any (unlikely with name match but possible if system+user have same name)
        // We can distinct or just let it be. Postgres 'DISTINCT ON (t.id)' might be safer.
        // Let's rely on simple fetch for now.

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
        const { amount, currency, category, account, note, subcategory_id } = body;

        // Basic validation
        if (!amount || !category || !account) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Default currency if missing
        let currencyCode = currency || 'AMD';
        let amountNum = parseFloat(amount);

        // Store original if conversion happens (req: "For other current transactions also save the origin amount currency")
        let originalAmount = null;
        let originalCurrency = null;

        // Currency Conversion Logic
        // 1 USD = 400 AMD
        // 1 EUR = 420 AMD
        if (currencyCode === 'USD') {
            originalAmount = amountNum;
            originalCurrency = 'USD';
            amountNum = amountNum * 400;
            currencyCode = 'AMD';
        } else if (currencyCode === 'EUR') {
            originalAmount = amountNum;
            originalCurrency = 'EUR';
            amountNum = amountNum * 420;
            currencyCode = 'AMD';
        }

        const insertQuery = `
      INSERT INTO transactions (user_email, amount, currency, category_name, account_name, note, subcategory_id, original_amount, original_currency)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

        await query(insertQuery, [
            session.user.email,
            amountNum,
            currencyCode,
            category,
            account,
            note || "",
            subcategory_id || null,
            originalAmount,
            originalCurrency
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Transaction error:", error);
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
