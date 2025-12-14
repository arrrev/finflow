import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET - Get user preferences
 */
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const userId = session.user.id;

        // Get or create user preferences
        let result = await query(
            `SELECT main_currency, enabled_currencies 
             FROM user_preferences 
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Create default preferences
            const defaultCurrency = 'USD'; // Will be set on registration, but fallback
            const defaultEnabled = ['USD', 'EUR', 'AMD'];
            
            await query(
                `INSERT INTO user_preferences (user_id, main_currency, enabled_currencies)
                 VALUES ($1, $2, $3)
                 RETURNING main_currency, enabled_currencies`,
                [userId, defaultCurrency, defaultEnabled]
            );
            
            return NextResponse.json({
                main_currency: defaultCurrency,
                enabled_currencies: defaultEnabled
            });
        }

        return NextResponse.json({
            main_currency: result.rows[0].main_currency || 'USD',
            enabled_currencies: result.rows[0].enabled_currencies || ['USD', 'EUR', 'AMD']
        });
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT - Update user preferences
 */
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const userId = session.user.id;
        const body = await request.json();
        const { main_currency, enabled_currencies } = body;

        // Validate main_currency is in enabled_currencies
        if (main_currency && enabled_currencies && !enabled_currencies.includes(main_currency)) {
            return NextResponse.json(
                { error: 'Main currency must be in enabled currencies list' },
                { status: 400 }
            );
        }

        // Update or insert preferences
        const result = await query(
            `INSERT INTO user_preferences (user_id, main_currency, enabled_currencies, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                 main_currency = COALESCE($2, user_preferences.main_currency),
                 enabled_currencies = COALESCE($3, user_preferences.enabled_currencies),
                 updated_at = CURRENT_TIMESTAMP
             RETURNING main_currency, enabled_currencies`,
            [userId, main_currency || null, enabled_currencies || null]
        );

        return NextResponse.json({
            main_currency: result.rows[0].main_currency,
            enabled_currencies: result.rows[0].enabled_currencies
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

