const { query } = require('./src/lib/db');

async function testCategoriesAPI() {
    const userId = 1;
    const userEmail = 'armarty5@gmail.com';

    try {
        console.log('1. Fetching categories...');
        const categoriesRes = await query(`
            SELECT * FROM categories 
            WHERE user_id = $1 OR user_id IS NULL 
            ORDER BY ordering DESC, id ASC
        `, [userId]);
        console.log('✓ Categories:', categoriesRes.rows.length);

        if (categoriesRes.rows.length === 0) {
            console.log('No categories found');
            process.exit(0);
        }

        const categoryIds = categoriesRes.rows.map(c => c.id);

        console.log('2. Fetching subcategories...');
        const subRes = await query(`
            SELECT * FROM subcategories 
            WHERE category_id = ANY($1) 
            ORDER BY ordering DESC, id ASC
        `, [categoryIds]);
        console.log('✓ Subcategories:', subRes.rows.length);

        console.log('3. Fetching transaction counts by category...');
        const txCountsRes = await query(`
            SELECT category_name, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1
            GROUP BY category_name
        `, [userEmail]);
        console.log('✓ TX counts:', txCountsRes.rows.length);

        console.log('4. Fetching plan counts by category...');
        const planCountsRes = await query(`
            SELECT category_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1
            GROUP BY category_id
        `, [userId]);
        console.log('✓ Plan counts:', planCountsRes.rows.length);

        console.log('5. Fetching subcategory transaction counts...');
        const subTxCountsRes = await query(`
            SELECT category_name, subcategory_name, COUNT(*) as count
            FROM transactions
            WHERE user_email = $1 AND subcategory_name IS NOT NULL
            GROUP BY category_name, subcategory_name
        `, [userEmail]);
        console.log('✓ Sub TX counts:', subTxCountsRes.rows.length);

        console.log('6. Fetching subcategory plan counts...');
        const subPlanCountsRes = await query(`
            SELECT subcategory_id, COUNT(*) as count
            FROM monthly_plans
            WHERE user_id = $1 AND subcategory_id IS NOT NULL
            GROUP BY subcategory_id
        `, [userId]);
        console.log('✓ Sub plan counts:', subPlanCountsRes.rows.length);

        console.log('\n✅ All queries succeeded!');

    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error('Stack:', e.stack);
    }
    process.exit(0);
}

testCategoriesAPI();
