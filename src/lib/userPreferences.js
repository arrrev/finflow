/**
 * Server-side utility to get user's main currency
 * This should only be used in API routes (server-side)
 */
import { query } from './db';

/**
 * Get user's main currency from users table
 * @param {number} userId - User ID
 * @returns {Promise<string>} Main currency code (defaults to 'USD' if not set)
 */
export async function getUserMainCurrency(userId) {
    try {
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

        const result = await query(
            `SELECT main_currency FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length > 0 && result.rows[0].main_currency) {
            return result.rows[0].main_currency;
        }

        // If no currency set, set default and return USD
        await query(
            `UPDATE users SET main_currency = 'USD' WHERE id = $1 AND main_currency IS NULL`,
            [userId]
        );

        return 'USD'; // Default fallback
    } catch (error) {
        console.error('Error getting user main currency:', error);
        return 'USD'; // Safe fallback
    }
}
