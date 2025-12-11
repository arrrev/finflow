import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, first_name, last_name } = body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 409 }
            );
        }

        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const result = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, first_name, last_name`,
            [email, hashedPassword, first_name, last_name]
        );

        const newUser = result.rows[0];
        const userId = newUser.id;

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

        return NextResponse.json({
            message: 'Registration successful',
            user: newUser
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: `Internal server error: ${error.message}` },
            { status: 500 }
        );
    }
}
