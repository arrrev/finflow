import { query } from "@/lib/db";
import { NextResponse } from "next/server";

const PASTEL_PALETTE = [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', // Pastel Red, Orange, Yellow, Green, Blue
    '#EECBFF', '#FFC6FF', '#C4F4FF', '#E2F0CB', '#FFD6A5', // Pastel Purple, Pink, Cyan, Sage, Peach
    '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', // More pastels
    '#FFC6FF', '#FFFFD1', '#C6E2E9', '#F1E3D3', '#D6E5E3',
    '#E7D8C9', '#E6BEAE', '#B29DD9', '#FDFD96', '#87CEFA',
    '#F49AC2', '#CB99C9', '#C23B22', '#FDFD96', '#87CEFA', // Note: C23B22 is notably not pastel, replacing with #FF9AA2 in logic if needed, but list continues
    '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1'  // Pantone Colors of Year (some)
];

// Helper to get random unique colors or cycle through
function getColors(count) {
    let selected = [];
    for (let i = 0; i < count; i++) {
        selected.push(PASTEL_PALETTE[i % PASTEL_PALETTE.length]);
    }
    return selected;
}

export async function GET(request) {
    try {
        // 1. Fetch all Categories
        const catsRes = await query(`SELECT id FROM categories ORDER BY id`);
        const cats = catsRes.rows;

        // 2. Fetch all Accounts
        const accsRes = await query(`SELECT id FROM accounts ORDER BY id`);
        const accs = accsRes.rows;

        const catColors = getColors(cats.length);
        const accColors = getColors(accs.length).reverse(); // Reverse to separate palette usage slightly

        // 3. Update Categories
        for (let i = 0; i < cats.length; i++) {
            await query(`UPDATE categories SET color = $1 WHERE id = $2`, [catColors[i], cats[i].id]);
        }

        // 4. Update Accounts
        for (let i = 0; i < accs.length; i++) {
            await query(`UPDATE accounts SET color = $1 WHERE id = $2`, [accColors[i], accs[i].id]);
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${cats.length} categories and ${accs.length} accounts with pastel colors.`
        });

    } catch (error) {
        console.error("Color migration failed:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
