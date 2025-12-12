import { query } from '@/lib/db';

export async function initializeUser(userId) {
    try {
        // Seed Initial Accounts
        const initialAccounts = [
            { name: 'Card', color: '#4a86e8', currency: 'AMD' },
            { name: 'Cash', color: '#6aa84f', currency: 'AMD' },
            { name: 'Saving', color: '#f1c232', currency: 'AMD' }
        ];

        for (const acc of initialAccounts) {
            await query(
                'INSERT INTO accounts (user_id, name, color, default_currency, balance_amd) VALUES ($1, $2, $3, $4, 0)',
                [userId, acc.name, acc.color, acc.currency]
            );
        }

        // Seed Initial Categories
        const initialCategories = [
            { name: 'Bill', color: '#cc0000' },
            { name: 'Food', color: '#e69138' },
            { name: 'Grocery', color: '#f6b26b' },
            { name: 'Salary', color: '#38761d' },
            { name: 'Transport', color: '#3d85c6' }
        ];

        let order = 1;
        for (const cat of initialCategories) {
            await query(
                'INSERT INTO categories (user_id, name, color, ordering) VALUES ($1, $2, $3, $4)',
                [userId, cat.name, cat.color, order++]
            );
        }

        return true;
    } catch (error) {
        console.error('Error initializing user:', error);
        throw error;
    }
}
