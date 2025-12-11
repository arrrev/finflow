import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Fetch categories  
        const categoriesRes = await query(`
            SELECT * FROM categories 
            WHERE user_id = $1 AND deleted_at IS NULL
            ORDER BY name ASC
        `, [session.user.id]);
        const categories = categoriesRes.rows;

        if (categories.length === 0) return NextResponse.json([]);

        // Fetch subcategories
        const categoryIds = categories.map(c => c.id);
        const subRes = await query(`
            SELECT * FROM subcategories 
            WHERE category_id = ANY($1) 
            ORDER BY name ASC
        `, [categoryIds]);

        // Fetch usage counts with GROUP BY
        const txCountsRes = await query(`
            SELECT category_id, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1
            GROUP BY category_id
        `, [session.user.email]);

        const planCountsRes = await query(`
            SELECT category_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1
            GROUP BY category_id
        `, [session.user.id]);

        // Build lookup maps
        const txCounts = {};
        txCountsRes.rows.forEach(r => txCounts[r.category_id] = parseInt(r.count));

        const planCounts = {};
        planCountsRes.rows.forEach(r => planCounts[r.category_id] = parseInt(r.count));

        // Fetch subcategory usage counts
        const subTxCountsRes = await query(`
            SELECT t.subcategory_id, COUNT(*) as count
            FROM transactions t
            WHERE t.user_email = $1 AND t.subcategory_id IS NOT NULL
            GROUP BY t.subcategory_id
        `, [session.user.email]);

        const subPlanCountsRes = await query(`
            SELECT subcategory_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1 AND subcategory_id IS NOT NULL
            GROUP BY subcategory_id
        `, [session.user.id]);

        const subTxCounts = {};
        subTxCountsRes.rows.forEach(r => {
            subTxCounts[r.subcategory_id] = parseInt(r.count);
        });

        const subPlanCounts = {};
        subPlanCountsRes.rows.forEach(r => subPlanCounts[r.subcategory_id] = parseInt(r.count));

        // Attach subcategories and counts
        const result = categories.map(cat => ({
            ...cat,
            tx_count: txCounts[cat.id] || 0,
            plan_count: planCounts[cat.id] || 0,
            subcategories: subRes.rows
                .filter(s => s.category_id === cat.id)
                .map(sub => ({
                    ...sub,
                    tx_count: subTxCounts[sub.id] || 0,
                    plan_count: subPlanCounts[sub.id] || 0
                }))
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Categories fetch error:", error);
        console.error("Error stack:", error.stack);
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { name, color, ordering, default_account_id, include_in_chart } = body;

        // Check for duplicate active category
        const check = await query(`
            SELECT id FROM categories 
            WHERE user_id = $1 AND name = $2 AND deleted_at IS NULL
        `, [session.user.id, name]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Category with this name already exists." }), { status: 409 });
        }

        const res = await query(`
            INSERT INTO categories (user_id, name, color, ordering, default_account_id, include_in_chart)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [session.user.id, name, color || '#fbbf24', ordering || 0, default_account_id || null, include_in_chart !== undefined ? include_in_chart : true]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Category create error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, name, color, ordering, default_account_id, include_in_chart } = body;

        const verify = await query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden or Not Found", { status: 403 });

        // Uniqueness check for rename
        const check = await query(`
            SELECT id FROM categories 
            WHERE user_id = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL
        `, [session.user.id, name, id]);

        if (check.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Category with this name already exists." }), { status: 409 });
        }

        // Update category
        const res = await query(`
            UPDATE categories 
            SET name = $1, color = $2, ordering = $3, default_account_id = $4, include_in_chart = $5
            WHERE id = $6
            RETURNING *
        `, [name, color, ordering, default_account_id || null, include_in_chart !== undefined ? include_in_chart : true, id]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Category update error:", error);
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
        await query('UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND user_id = $2', [id, session.user.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Category delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
