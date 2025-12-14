import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET - Get user main currency
 */
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const userId = session.user.id;

        // Ensure column exists first
        try {
            await query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS main_currency VARCHAR(3) DEFAULT 'USD'
            `);
        } catch (columnError) {
            // Column might already exist, that's fine
            console.log('Column check:', columnError.message);
        }

        // Get user's main currency
        const result = await query(
            `SELECT main_currency FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const mainCurrency = result.rows[0].main_currency || 'USD';

        // If no currency set, set default
        if (!result.rows[0].main_currency) {
            await query(
                `UPDATE users SET main_currency = 'USD' WHERE id = $1`,
                [userId]
            );
        }

        return NextResponse.json({
            main_currency: mainCurrency
        });
    } catch (error) {
        console.error('Error fetching user currency:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}

/**
 * PUT - Update user main currency
 */
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const userId = session.user.id;
        const body = await request.json();
        const { main_currency } = body;

        if (!main_currency) {
            return NextResponse.json(
                { error: 'main_currency is required' },
                { status: 400 }
            );
        }

        // Ensure column exists first
        try {
            await query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS main_currency VARCHAR(3) DEFAULT 'USD'
            `);
        } catch (columnError) {
            // Column might already exist, that's fine
            console.log('Column check:', columnError.message);
        }

        // Update user's main currency
        const result = await query(
            `UPDATE users 
             SET main_currency = $1 
             WHERE id = $2
             RETURNING main_currency`,
            [main_currency, userId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            main_currency: result.rows[0].main_currency
        });
    } catch (error) {
        console.error('Error updating user currency:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}

