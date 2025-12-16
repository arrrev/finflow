import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchangeRates";
import { getUserMainCurrency } from "@/lib/userPreferences";

export const dynamic = 'force-dynamic';


export async function GET(request) {
    console.log("Analytics API v2 (Native Calc) Called");
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
                df = "AND EXTRACT(YEAR FROM created_at) = $2";
                queryParams.push(parseInt(m));
            } else { // Month - use date range to avoid timezone issues
                const [year, monthNum] = m.split('-');
                const monthStart = `${year}-${monthNum}-01`;
                const nextMonthStart = monthNum === '12' 
                    ? `${parseInt(year) + 1}-01-01`
                    : `${year}-${String(parseInt(monthNum) + 1).padStart(2, '0')}-01`;
                df = "AND created_at >= $2::date AND created_at < $3::date";
                queryParams.push(monthStart, nextMonthStart);
            }
        } else {
            // Default current month - use date range
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const monthStart = `${year}-${month}-01`;
            const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
            const nextYear = now.getMonth() === 11 ? year + 1 : year;
            const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
            df = "AND created_at >= $2::date AND created_at < $3::date";
            queryParams.push(monthStart, nextMonthStart);
        }

        // 1. Account Balances - Early return if no accounts
        const accountRes = await query(`
            SELECT a.id,
                   a.name as account, 
                   a.default_currency,
                   a.color,
                   a.initial_balance,
                   a.balance,
                   a.is_available
            FROM accounts a
            WHERE a.user_id = (SELECT id FROM users WHERE email = $1)
            ORDER BY a.name ASC
        `, [email]);

        // Early return if no accounts (much faster)
        if (accountRes.rows.length === 0) {
            const userMainCurrency = await getUserMainCurrency(session.user.id);
            return NextResponse.json({
                accountBalances: [],
                categoryTotals: [],
                plannedVsSpent: [],
                totalBalance: 0,
                totalAvailable: 0,
                userMainCurrency: userMainCurrency
            }, {
                headers: {
                    'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
                }
            });
        }

        // Use stored balance from accounts table (much faster - no need to sum transactions)
        const accountBalances = accountRes.rows.map(a => {
            const storedBalance = parseFloat(a.balance || 0);
            const accountCurrency = a.default_currency || 'USD';

            return {
                account: a.account,
                balance_native: storedBalance, // Stored balance already includes initial + transactions
                color: a.color,
                currency: accountCurrency,
                is_available: a.is_available
            };
        });

        // Get user's main currency and exchange rates for batch conversion
        const [userMainCurrency, rates] = await Promise.all([
            getUserMainCurrency(session.user.id),
            getExchangeRates()
        ]);

        // Convert all account balances to user's main currency for summary (synchronous, much faster)
        const accountBalancesWithConverted = accountBalances.map((acc) => {
            let balanceInUserCurrency = acc.balance_native;
            if (acc.currency !== userMainCurrency && rates[acc.currency] && rates[userMainCurrency]) {
                // Convert via USD as base (same logic as convertCurrency but synchronous)
                const amountInUSD = acc.balance_native / rates[acc.currency];
                balanceInUserCurrency = amountInUSD * rates[userMainCurrency];
            }

            return {
                ...acc,
                balance: balanceInUserCurrency, // Converted to user's main currency for "Total" display
                original_balance: acc.balance_native // Native currency balance
            };
        });

        // Filter out zero balances
        const filteredBalances = accountBalancesWithConverted.filter(a => Math.abs(a.balance) > 0.01);

        // Calculate totals in user's main currency
        const totalBalance = filteredBalances.reduce((sum, a) => sum + a.balance, 0);
        const totalAvailable = filteredBalances
            .filter(a => a.is_available)
            .reduce((sum, a) => sum + a.balance, 0);

        // 2. Category Totals (with subcategory breakdown)
        const categoryRes = await query(`
        SELECT c.id as category_id,
               c.name as category, 
               sum(t.amount) as total,
               MAX(c.color) as color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_email = $1 ${df}
          AND (c.include_in_chart IS NOT FALSE)
        GROUP BY c.id, c.name
        ORDER BY total ASC -- Expenses are negative, so sorting ASC puts biggest expenses first
     `, queryParams);

        // Fetch subcategory totals
        const categoryIds = categoryRes.rows.map(r => r.category_id);
        let subcategoryTotals = [];
        if (categoryIds.length > 0) {
            const subcategoryRes = await query(`
                SELECT s.category_id,
                       s.id as subcategory_id,
                       s.name as subcategory,
                       SUM(t.amount) as total
                FROM transactions t
                LEFT JOIN subcategories s ON t.subcategory_id = s.id
                WHERE t.user_email = $1 ${df}
                  AND t.subcategory_id IS NOT NULL
                  AND s.category_id = ANY($${queryParams.length + 1}::int[])
                GROUP BY s.category_id, s.id, s.name
                ORDER BY s.category_id, total ASC
            `, [...queryParams, categoryIds]);

            subcategoryTotals = subcategoryRes.rows.map(r => ({
                category_id: r.category_id,
                subcategory: r.subcategory,
                total: Number(r.total)
            }));
        }

        const categoryTotals = categoryRes.rows.map(r => {
            const subcategories = subcategoryTotals.filter(s => s.category_id === r.category_id);
            return {
                category_id: r.category_id,
                category: r.category,
                total: Number(r.total), // This will be negative for expenses
                color: r.color || '#cccccc',
                subcategories: subcategories.length > 0 ? subcategories : null
            };
        });

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
                // Fetch Plans (with subcategory breakdown) in a single query - much faster
                const plansRes = await query(`
                    SELECT 
                        c.id as category_id,
                        c.name as category,
                        s.id as subcategory_id,
                        s.name as subcategory,
                        SUM(mp.amount) as planned
                    FROM monthly_plans mp
                    JOIN categories c ON mp.category_id = c.id
                    LEFT JOIN subcategories s ON mp.subcategory_id = s.id
                    WHERE mp.user_id = (SELECT id FROM users WHERE email = $1) ${planQuery}
                      AND (c.include_in_chart IS NOT FALSE)
                    GROUP BY c.id, c.name, s.id, s.name
                `, planParams);

                // Separate into category and subcategory plans
                const categoryPlans = plansRes.rows.filter(p => !p.subcategory_id);
                const subcategoryPlans = plansRes.rows.filter(p => p.subcategory_id);

                const merged = {};

                // Initialize with category totals and subcategories
                categoryTotals.forEach(c => {
                    merged[c.category] = { 
                        category: c.category, 
                        category_id: c.category_id,
                        spent: parseFloat(c.total), 
                        planned: 0,
                        subcategories: c.subcategories ? c.subcategories.map(s => ({ ...s, planned: 0 })) : null
                    };
                });

                // Add category-level plans
                // Plans are stored as negative values, so use Math.abs for calculations
                categoryPlans.forEach(p => {
                    if (!merged[p.category]) {
                        merged[p.category] = { 
                            category: p.category, 
                            category_id: p.category_id,
                            spent: 0, 
                            planned: 0,
                            subcategories: null
                        };
                    }
                    // Plans are negative, so use Math.abs to get the positive planned amount
                    merged[p.category].planned += Math.abs(parseFloat(p.planned || 0));
                });

                // Add subcategory-level plans
                subcategoryPlans.forEach(p => {
                    if (!merged[p.category]) {
                        merged[p.category] = { 
                            category: p.category, 
                            category_id: p.category_id,
                            spent: 0, 
                            planned: 0,
                            subcategories: []
                        };
                    }
                    if (!merged[p.category].subcategories) {
                        merged[p.category].subcategories = [];
                    }
                    const subIndex = merged[p.category].subcategories.findIndex(s => s.subcategory === p.subcategory);
                    // Plans are negative, so use Math.abs to get the positive planned amount
                    const plannedAmount = Math.abs(parseFloat(p.planned || 0));
                    if (subIndex >= 0) {
                        merged[p.category].subcategories[subIndex].planned += plannedAmount;
                    } else {
                        merged[p.category].subcategories.push({
                            subcategory: p.subcategory,
                            total: 0, // Will be filled from categoryTotals
                            planned: plannedAmount
                        });
                    }
                });

                // Merge subcategory spent amounts from categoryTotals
                Object.values(merged).forEach(item => {
                    if (item.subcategories && categoryTotals.find(c => c.category === item.category)?.subcategories) {
                        const catData = categoryTotals.find(c => c.category === item.category);
                        item.subcategories.forEach(sub => {
                            const subData = catData.subcategories.find(s => s.subcategory === sub.subcategory);
                            if (subData) {
                                sub.total = subData.total;
                            }
                        });
                    }
                    
                    // Sum subcategory planned amounts to parent category's planned amount
                    if (item.subcategories && item.subcategories.length > 0) {
                        const subcategoryPlannedTotal = item.subcategories.reduce((sum, sub) => {
                            return sum + Math.abs(sub.planned || 0);
                        }, 0);
                        // Add subcategory planned total to parent category planned
                        // Only if there's no category-level plan, or if subcategory plans exist
                        item.planned += subcategoryPlannedTotal;
                    }
                });

                plannedVsSpent = Object.values(merged).sort((a, b) => a.category.localeCompare(b.category));
            }
        }

        return NextResponse.json({
            accountBalances: filteredBalances,
            totalAvailable,
            totalBalance,
            categoryTotals,
            plannedVsSpent,
            month: m,
            userMainCurrency: userMainCurrency // Include user's main currency for display
        }, {
            headers: {
                'Cache-Control': 'private, max-age=30' // Cache for 30 seconds
            }
        });

    } catch (error) {
        console.error("Analytics fetch error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
