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
            WHERE user_id = $1 OR user_id IS NULL 
            ORDER BY ordering DESC, id ASC
        `, [session.user.id]);
        const categories = categoriesRes.rows;

        if (categories.length === 0) return NextResponse.json([]);

        // Fetch subcategories
        const categoryIds = categories.map(c => c.id);
        const subRes = await query(`
            SELECT * FROM subcategories 
            WHERE category_id = ANY($1) 
            ORDER BY ordering DESC, id ASC
        `, [categoryIds]);

        // Fetch usage counts with GROUP BY
        const txCountsRes = await query(`
            SELECT category_name, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1
            GROUP BY category_name
        `, [session.user.email]);

        const planCountsRes = await query(`
            SELECT category_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1
            GROUP BY category_id
        `, [session.user.id]);

        // Build lookup maps
        const txCounts = {};
        txCountsRes.rows.forEach(r => txCounts[r.category_name] = parseInt(r.count));

        const planCounts = {};
        planCountsRes.rows.forEach(r => planCounts[r.category_id] = parseInt(r.count));

        // Fetch subcategory usage counts
        const subTxCountsRes = await query(`
            SELECT category_name, subcategory_name, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1 AND subcategory_name IS NOT NULL
            GROUP BY category_name, subcategory_name
        `, [session.user.email]);

        const subPlanCountsRes = await query(`
            SELECT subcategory_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1 AND subcategory_id IS NOT NULL
            GROUP BY subcategory_id
        `, [session.user.id]);

        const subTxCounts = {};
        subTxCountsRes.rows.forEach(r => {
            const key = `${r.category_name}:${r.subcategory_name}`;
            subTxCounts[key] = parseInt(r.count);
        });

        const subPlanCounts = {};
        subPlanCountsRes.rows.forEach(r => subPlanCounts[r.subcategory_id] = parseInt(r.count));

        // Attach subcategories and counts
        const result = categories.map(cat => ({
            ...cat,
            tx_count: txCounts[cat.name] || 0,
            plan_count: planCounts[cat.id] || 0,
            subcategories: subRes.rows
                .filter(s => s.category_id === cat.id)
                .map(sub => ({
                    ...sub,
                    tx_count: subTxCounts[`${cat.name}:${sub.name}`] || 0,
                    plan_count: subPlanCounts[sub.id] || 0
                }))
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error("Categories fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { name, color, ordering } = body;

        const res = await query(`
            INSERT INTO categories (user_id, name, color, ordering)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [session.user.id, name, color || '#fbbf24', ordering || 0]);

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
        const { id, name, color, ordering } = body;

        // Ensure user owns this category OR it is a system category
        const verify = await query('SELECT id, name FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden or Not Found", { status: 403 });

        const oldName = verify.rows[0].name;

        // If name changed, update transactions that reference this category
        if (oldName !== name) {
            await query(`
                UPDATE transactions 
                SET category_name = $1 
                WHERE user_email = $2 AND category_name = $3
            `, [name, session.user.email, oldName]);
        }

        // Update category
        const res = await query(`
            UPDATE categories 
            SET name = $1, color = $2, ordering = $3
            WHERE id = $4
            RETURNING *
        `, [name, color, ordering, id]);

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

        // 1. Get Category Name
        const catRes = await query('SELECT name FROM categories WHERE id=$1 AND (user_id=$2 OR user_id IS NULL)', [id, session.user.id]);
        if (catRes.rowCount === 0) return new NextResponse("Forbidden or Not Found", { status: 403 });
        const catName = catRes.rows[0].name;

        // 2. Check Transactions
        const txCheck = await query('SELECT id FROM transactions WHERE user_email=$1 AND category_name=$2 LIMIT 1', [session.user.email, catName]);
        if (txCheck.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Cannot delete: Transactions exist with this category." }), { status: 409 });
        }

        // 3. Check Plans
        const planCheck = await query('SELECT id FROM monthly_plans WHERE user_id=$1 AND category_id=$2 LIMIT 1', [session.user.id, id]);
        if (planCheck.rowCount > 0) {
            return new NextResponse(JSON.stringify({ error: "Cannot delete: Monthly Plans exist." }), { status: 409 });
        }

        await query('DELETE FROM categories WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Category delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
