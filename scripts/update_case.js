const { query } = require('../src/lib/db');

function toTitleCase(str) {
    if (!str) return str;
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

async function updateCategoryCase() {
    try {
        console.log('Starting case update for categories and subcategories...\n');

        // Temporarily disable foreign key constraints
        console.log('Disabling foreign key constraint temporarily...');
        await query('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_name_fkey');

        // 1. Update Categories - Use temp names first to avoid unique constraint violations
        console.log('\n1. Fetching categories...');
        const cats = await query('SELECT id, name, user_id FROM categories');
        console.log(`Found ${cats.rows.length} categories`);

        const updates = [];
        for (const cat of cats.rows) {
            const newName = toTitleCase(cat.name);
            if (newName !== cat.name) {
                updates.push({ id: cat.id, oldName: cat.name, newName, tempName: `__TEMP_${cat.id}__` });
            }
        }

        // Step 1: Rename all categories to temp names
        for (const u of updates) {
            console.log(`  Temp: "${u.oldName}" → "${u.tempName}"`);
            await query('UPDATE categories SET name = $1 WHERE id = $2', [u.tempName, u.id]);
            await query('UPDATE transactions SET category_name = $1 WHERE category_name = $2', [u.tempName, u.oldName]);
        }

        // Step 2: Rename temp to final names
        for (const u of updates) {
            console.log(`  Final: "${u.tempName}" → "${u.newName}"`);
            await query('UPDATE categories SET name = $1 WHERE id = $2', [u.newName, u.id]);
            await query('UPDATE transactions SET category_name = $1 WHERE category_name = $2', [u.newName, u.tempName]);
        }

        // 2. Update Subcategories
        console.log('\n2. Fetching subcategories...');
        const subs = await query('SELECT id, name, category_id FROM subcategories');
        console.log(`Found ${subs.rows.length} subcategories`);

        const subUpdates = [];
        for (const sub of subs.rows) {
            const newName = toTitleCase(sub.name);
            if (newName !== sub.name) {
                subUpdates.push({ id: sub.id, oldName: sub.name, newName, tempName: `__TEMP_SUB_${sub.id}__` });
            }
        }

        // Step 1: Rename to temp
        for (const u of subUpdates) {
            console.log(`  Temp: "${u.oldName}" → "${u.tempName}"`);
            await query('UPDATE subcategories SET name = $1 WHERE id = $2', [u.tempName, u.id]);
        }

        // Step 2: Rename to final
        for (const u of subUpdates) {
            console.log(`  Final: "${u.tempName}" → "${u.newName}"`);
            await query('UPDATE subcategories SET name = $1 WHERE id = $2', [u.newName, u.id]);
        }

        // Re-add foreign key constraint
        console.log('\n Re-adding foreign key constraint...');
        await query(`
            ALTER TABLE transactions 
            ADD CONSTRAINT transactions_category_name_fkey 
            FOREIGN KEY (category_name) REFERENCES categories(name) 
            ON UPDATE CASCADE
        `);

        console.log('\n✅ Successfully updated all categories and subcategories to proper case!');
        console.log(`   Categories updated: ${updates.length}`);
        console.log(`   Subcategories updated: ${subUpdates.length}`);

    } catch (e) {
        console.error('❌ Error:', e);
        // Try to restore constraint even if something failed
        try {
            await query(`
                ALTER TABLE transactions 
                ADD CONSTRAINT transactions_category_name_fkey 
                FOREIGN KEY (category_name) REFERENCES categories(name) 
                ON UPDATE CASCADE
            `);
        } catch (restoreErr) {
            console.error('Failed to restore constraint:', restoreErr.message);
        }
    }
    process.exit(0);
}

updateCategoryCase();
