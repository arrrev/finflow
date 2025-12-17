import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        // Fetch upcoming reminders for the current month
        // Logic:
        // 1. Plan has a reminder_date
        // 2. Plan is incomplete (Abs(spent) < Abs(amount))? User said "Show not-completed category... and remaining amount"
        // 3. We assume "current month" context for "Upcoming", or just "Future in current month"?
        // Let's default to "Current Month Plans with Reminders".

        const month = new Date().toISOString().slice(0, 7); // YYYY-MM
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
                   s.name as subcategory_name,
                   COALESCE(SUM(t.amount), 0) as spent
            FROM monthly_plans mp
            JOIN categories c ON mp.category_id = c.id
            LEFT JOIN subcategories s ON mp.subcategory_id = s.id
            LEFT JOIN transactions t ON (
                t.user_id = $1 
                AND t.created_at >= $3::date
                AND t.created_at < $4::date
                AND t.category_id = mp.category_id
                AND (
                    (mp.subcategory_id IS NULL AND t.subcategory_id IS NULL) OR
                    (mp.subcategory_id IS NOT NULL AND t.subcategory_id = mp.subcategory_id)
                )
            )
            WHERE mp.user_id = $1 
              AND mp.month = $2
              AND mp.reminder_date IS NOT NULL
            GROUP BY mp.id, mp.month, mp.category_id, mp.subcategory_id, mp.amount, mp.reminder_date, mp.created_at, c.name, c.color, s.name
            ORDER BY mp.reminder_date ASC
        `, [session.user.id, month, monthStart, nextMonthStart]);

        const reminders = res.rows.map(r => {
            const planned = Math.abs(parseFloat(r.amount || 0));
            const spent = Math.abs(parseFloat(r.spent || 0));
            const remaining = planned - spent;

            // Only return if "not completed" (remaining > 0)
            // User: "Show not-completed category... and remaining amount"
            if (remaining <= 0) return null;

            return {
                id: r.id,
                category_name: r.category_name,
                category_id: r.category_id,
                subcategory_name: r.subcategory_name,
                subcategory_id: r.subcategory_id,
                color: r.category_color,
                date: r.reminder_date,
                amount: r.amount,
                spent: r.spent,
                remaining
            };
        }).filter(r => r !== null);

        return NextResponse.json(reminders);
    } catch (error) {
        console.error("Reminders fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
