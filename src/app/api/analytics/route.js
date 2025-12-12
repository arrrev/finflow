import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchangeRates";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    const email = session.user.email;

    try {
        let queryParams = [email];
        let df = "";

        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const m = searchParams.get("month"); // Can be YYYY-MM or YYYY

        if (from && to) {
            df = "AND created_at::date >= $2 AND created_at::date <= $3";
            queryParams.push(from, to);
        } else if (m) {
            if (m.length === 4) { // Year
                df = "AND to_char(created_at, 'YYYY') = $2";
                queryParams.push(m);
            } else { // Month
                df = "AND to_char(created_at, 'YYYY-MM') = $2";
                queryParams.push(m);
            }
        } else {
            // Default current month
            df = "AND to_char(created_at, 'YYYY-MM') = $2";
            queryParams.push(new Date().toISOString().slice(0, 7));
        }

        // 1. Account Balances
        const accountRes = await query(`
            SELECT a.name as account, 
                   a.default_currency,
                   a.color,
                   a.ordering,
                   a.initial_balance,
                   COALESCE(SUM(t.amount), 0) as tx_balance 
            FROM accounts a
            LEFT JOIN transactions t ON t.account_id = a.id
            WHERE a.user_id = (SELECT id FROM users WHERE email = $1)
              AND a.deleted_at IS NULL
            GROUP BY a.id, a.name, a.default_currency, a.color, a.ordering, a.initial_balance
            ORDER BY a.name ASC
        `, [email]);

        // Get current exchange rates for reverse conversion
        const rates = await getExchangeRates();

        const accountBalances = accountRes.rows
            .map(a => {
                const initial = parseFloat(a.initial_balance || 0);
                const txBal = parseFloat(a.tx_balance || 0);
                const bal = initial + txBal;

                return {
                    account: a.account,
                    balance: bal,
                    color: a.color,
                    currency: a.default_currency,
                    original_balance: a.default_currency === 'USD' ? bal / rates.USD : a.default_currency === 'EUR' ? bal / rates.EUR : bal
                };
            })
            .filter(a => a.balance !== 0); // Remove zero balances

        // 2. Category Totals
        const categoryRes = await query(`
        SELECT c.name as category, 
               sum(t.amount) as total,
               MAX(c.color) as color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_email = $1 ${df}
          AND (c.include_in_chart IS NOT FALSE)
        GROUP BY c.id, c.name
        ORDER BY total ASC -- Expenses are negative, so sorting ASC puts biggest expenses first
     `, queryParams);

        const categoryTotals = categoryRes.rows.map(r => ({
            category: r.category,
            total: Number(r.total), // This will be negative for expenses
            color: r.color || '#cccccc'
        }));

        // 3. Planned vs Spent (For selected month only - if applicable)
        // Only feasible if we have a specific month. If Year or Range, skipping or aggregating?
        // Let's aggregate if possible, but 'monthly_plans' are by month.
        // Simple logic: if specific month is selected (length=7), show. Else empty.

        let plannedVsSpent = [];
        if (m) {
            let planQuery = "";
            let planParams = [email];

            if (m.length === 7) { // Month: YYYY-MM
                planQuery = "AND mp.month = $2";
                planParams.push(m);
            } else if (m.length === 4) { // Year: YYYY
                planQuery = "AND mp.month LIKE $2 || '-%'"; // Postgres string check for YYYY-MM starting with YYYY
                planParams.push(m);
            }

            if (planQuery) {
                // Fetch Plans
                const plansRes = await query(`
                    SELECT c.name as category, SUM(mp.amount) as planned
                    FROM monthly_plans mp
                    JOIN categories c ON mp.category_id = c.id
                    WHERE mp.user_id = (SELECT id FROM users WHERE email = $1) ${planQuery}
                      AND (c.include_in_chart IS NOT FALSE)
                    GROUP BY c.name
                `, planParams);

                const plans = plansRes.rows;
                const merged = {};

                categoryTotals.forEach(c => {
                    merged[c.category] = { category: c.category, spent: parseFloat(c.total), planned: 0 };
                });

                plans.forEach(p => {
                    if (!merged[p.category]) {
                        merged[p.category] = { category: p.category, spent: 0, planned: 0 };
                    }
                    merged[p.category].planned += parseFloat(p.planned); // Aggregate if multiple rows match (though Group By c.name handles it)
                });

                plannedVsSpent = Object.values(merged).sort((a, b) => a.category.localeCompare(b.category));
            }
        }

        return NextResponse.json({
            accountBalances,
            categoryTotals,
            plannedVsSpent,
            month: m
        });

    } catch (error) {
        console.error("Analytics fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
