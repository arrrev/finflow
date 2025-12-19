/**
 * Migration script to add user_preferences table
 * Run this to add currency preferences support
 */

const { query } = require('../src/lib/db');

async function migrate() {
    try {
        console.log('Starting user_preferences migration...');

        // Create user_preferences table
        await query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                main_currency VARCHAR(3) DEFAULT 'USD',
                enabled_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'AMD'],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create index
        await query(`
            CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
            ON user_preferences(user_id)
        `);

        // Migrate existing users: set default preferences
        const users = await query('SELECT id FROM users');
        for (const user of users.rows) {
            // Check if preferences already exist
            const existing = await query(
                'SELECT id FROM user_preferences WHERE user_id = $1',
                [user.id]
            );

            if (existing.rows.length === 0) {
                // Create default preferences for existing users
                await query(
                    `INSERT INTO user_preferences (user_id, main_currency, enabled_currencies)
                     VALUES ($1, $2, $3)`,
                    [user.id, 'USD', ['USD', 'EUR', 'AMD']]
                );
                console.log(`Created preferences for user ${user.id}`);
            }
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();



