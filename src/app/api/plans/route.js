import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM

    if (!month) return new NextResponse("Month required", { status: 400 });

    try {
        // Calculate spent amount for each plan strictly
        // For subcategory plans: sum transactions with matching subcategory_id
        // For category(general) plans: sum transactions with matching category_id AND subcategory_id IS NULL
        // Use date range for month filtering to avoid timezone issues
        const [year, monthNum] = month.split('-');
        const monthStart = `${year}-${monthNum}-01`;
        const nextMonthStart = monthNum === '12' 
            ? `${parseInt(year) + 1}-01-01`
            : `${year}-${String(parseInt(monthNum) + 1).padStart(2, '0')}-01`;

        const res = await query(`
            SELECT mp.*, 
                   c.name as category_name, 
                   c.color as category_color,
                   c.ordering as category_ordering,
                   s.name as subcategory_name,
                   COALESCE(
                     (SELECT SUM(amount) FROM transactions t 
                      WHERE t.user_email = $3 
                        AND t.created_at >= $4::date
                        AND t.created_at < $5::date
                        AND t.category_id = mp.category_id
                        AND (
                          (mp.subcategory_id IS NULL AND t.subcategory_id IS NULL) OR
                          (mp.subcategory_id IS NOT NULL AND t.subcategory_id = mp.subcategory_id)
                        )
                     ), 0
                   ) as spent,
                   CASE 
                     WHEN mp.reminder_date IS NOT NULL 
                     THEN to_char(mp.reminder_date, 'YYYY-MM-DD')
                     ELSE NULL
                   END as reminder_date
            FROM monthly_plans mp
            JOIN categories c ON mp.category_id = c.id
            LEFT JOIN subcategories s ON mp.subcategory_id = s.id
            WHERE mp.user_id = $1 AND mp.month = $2
            ORDER BY c.name ASC, s.name ASC
        `, [session.user.id, month, session.user.email, monthStart, nextMonthStart]);

        return NextResponse.json(res.rows);
    } catch (error) {
        console.error("Plans fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();

        // Handle "Copy" action if present
        if (body.action === 'copy') {
            const { fromMonth, toMonth } = body;
            // Delete existing plans for target month to avoid messy heavy merge? 
            // Or just insert missing? User said "copy", usually implies replacing or initializing.
            // Let's assume we want to replicate. I'll simple insert ignore or just insert.
            // Requirement: "option to copy from one month to another"

            // 1. Fetch source plans
            const sourcePlans = await query('SELECT category_id, subcategory_id, amount FROM monthly_plans WHERE user_id=$1 AND month=$2', [session.user.id, fromMonth]);

            if (sourcePlans.rows.length === 0) return NextResponse.json({ message: "No plans to copy" });

            // 2. Insert into target
            // We should check if target already has plans? 
            // Let's just append for now, user can manage duplicates if they exist, or we can use ON CONFLICT DO NOTHING if we had a unique constraint (we don't enforced yet).

            for (const plan of sourcePlans.rows) {
                await query(`
                   INSERT INTO monthly_plans (user_id, month, category_id, subcategory_id, amount)
                   VALUES ($1, $2, $3, $4, $5)
               `, [session.user.id, toMonth, plan.category_id, plan.subcategory_id, plan.amount]);
            }

            return NextResponse.json({ success: true, count: sourcePlans.rows.length });
        }

        // Normal Create
        const { month, category_id, subcategory_id, amount, reminder_date } = body;

        // Handle reminder_date to avoid timezone issues
        let reminderDateValue = null;
        if (reminder_date) {
            // If it's a YYYY-MM-DD string, store it as a date without time
            if (typeof reminder_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reminder_date)) {
                // Store as date only, no time component to avoid timezone shifts
                reminderDateValue = reminder_date;
            } else {
                reminderDateValue = reminder_date;
            }
        }

        const res = await query(`
            INSERT INTO monthly_plans (user_id, month, category_id, subcategory_id, amount, reminder_date)
            VALUES ($1, $2, $3, $4, $5, $6::date)
            RETURNING *
        `, [session.user.id, month, category_id, subcategory_id || null, parseFloat(amount), reminderDateValue]);

        return NextResponse.json(res.rows[0]);

    } catch (error) {
        console.error("Plan create error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();
        const { id, amount, reminder_date } = body;

        // Verify ownership
        const verify = await query('SELECT id FROM monthly_plans WHERE id=$1 AND user_id=$2', [id, session.user.id]);
        if (verify.rowCount === 0) return new NextResponse("Forbidden", { status: 403 });

        // Handle reminder_date to avoid timezone issues
        let reminderDateValue = null;
        if (reminder_date) {
            // If it's a YYYY-MM-DD string, store it as a date without time
            if (typeof reminder_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reminder_date)) {
                // Store as date only, no time component to avoid timezone shifts
                reminderDateValue = reminder_date;
            } else {
                reminderDateValue = reminder_date;
            }
        }

        const res = await query(`
            UPDATE monthly_plans
            SET amount = $1, reminder_date = $2::date
            WHERE id = $3 AND user_id = $4
            RETURNING *
        `, [parseFloat(amount), reminderDateValue, id, session.user.id]);

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("Plan update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        await query('DELETE FROM monthly_plans WHERE id = $1 AND user_id = $2', [id, session.user.id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Plan delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
