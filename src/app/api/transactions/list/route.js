import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "created_at"; // created_at, amount, category_name
    const order = searchParams.get("order") || "DESC"; // ASC, DESC
    const filterBy = searchParams.get("filterBy"); // category_name, account_name
    const filterValue = searchParams.get("filterValue");

    try {
        const email = session.user.email;

        let whereClause = `WHERE user_email = $1`;
        const params = [email];
        let paramCounter = 2;

        if (filterBy && filterValue) {
            // Validate column name to prevent injection
            const allowedFilters = ['category_name', 'account_name'];
            if (allowedFilters.includes(filterBy)) {
                whereClause += ` AND ${filterBy} = $${paramCounter}`;
                params.push(filterValue);
            }
        }

        const validSorts = ['created_at', 'amount', 'category_name', 'account_name', 'note'];
        const safeSort = validSorts.includes(sortBy) ? sortBy : 'created_at';
        const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

        const sql = `
        SELECT t.id, t.amount, t.currency, t.category_name, t.account_name, t.note, t.created_at,
               c.color as category_color, a.color as account_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_name = c.name
        LEFT JOIN accounts a ON t.account_name = a.name
        ${whereClause.replace(/user_email/g, 't.user_email').replace(/AND (\w+)/g, 'AND t.$1')}
        ORDER BY t.${safeSort} ${safeOrder}
     `;

        const res = await query(sql, params);
        return NextResponse.json(res.rows);

    } catch (error) {
        console.error("List error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
