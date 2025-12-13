import { query } from '@/lib/db';

export async function initializeUser(userId) {
    try {
        // User initialization - accounts and categories will be created through the onboarding wizard
        // This function is kept for future initialization needs if required
        return true;
    } catch (error) {
        console.error('Error initializing user:', error);
        throw error;
    }
}
