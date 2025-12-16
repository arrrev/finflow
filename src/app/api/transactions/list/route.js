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
    const sortBy = searchParams.get("sortBy") || "id"; // id, created_at, amount, category_name
    const order = searchParams.get("order") || "DESC"; // ASC, DESC
    const filterBy = searchParams.get("filterBy"); // category_name, account_name
    const filterValue = searchParams.get("filterValue");

    try {
        const userId = session.user.id;

        let whereClause = `WHERE t.user_id = $1`;
        const params = [userId];
        let paramCounter = 2;

        if (filterBy && filterValue) {
            // Validate column name to prevent injection
            if (filterBy === 'category_name') {
                whereClause += ` AND c.name = $${paramCounter}`;
                params.push(filterValue);
            } else if (filterBy === 'account_name') {
                whereClause += ` AND a.name = $${paramCounter}`;
                params.push(filterValue);
            } else if (filterBy === 'category_id') {
                whereClause += ` AND t.category_id = $${paramCounter}`;
                params.push(filterValue);
            } else if (filterBy === 'account_id') {
                whereClause += ` AND t.account_id = $${paramCounter}`;
                params.push(filterValue);
            }
        }

        const validSorts = ['id', 'created_at', 'amount', 'category_name', 'account_name', 'note'];
        const safeSort = validSorts.includes(sortBy) ? sortBy : 'created_at';
        const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

        // Map sort field to correct table alias
        let orderByClause = `t.${safeSort}`;
        if (safeSort === 'category_name') orderByClause = `c.name`;
        if (safeSort === 'account_name') orderByClause = `a.name`;
        if (safeSort === 'created_at') orderByClause = `t.created_at`; // explicit
        if (safeSort === 'id') orderByClause = `t.id`; // explicit

        const sql = `
        SELECT t.id, t.amount, t.currency, t.note, t.created_at,
               c.name as category_name, c.color as category_color,
               a.name as account_name, a.color as account_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        ${whereClause}
        ORDER BY ${orderByClause} ${safeOrder}
     `;

        const res = await query(sql, params);
        return NextResponse.json(res.rows);

    } catch (error) {
        console.error("List error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
