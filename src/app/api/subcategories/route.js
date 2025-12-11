import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { category_id, name } = body;

        // Verify category ownership or global
        const cat = await query('SELECT id FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)', [category_id, session.user.id]);
        if (cat.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        const res = await query(`
            INSERT INTO subcategories (category_id, name)
            VALUES ($1, $2)
            RETURNING *
        `, [category_id, name]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Subcategory create error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        // Verify ownership via category join
        const verify = await query(`
            SELECT s.id 
            FROM subcategories s
            JOIN categories c ON s.category_id = c.id
            WHERE s.id = $1 AND c.user_id = $2
        `, [id, session.user.id]);

        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        await query('DELETE FROM subcategories WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subcategory delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
