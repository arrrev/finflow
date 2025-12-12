import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { Readable } from 'stream';
import csv from 'csv-parser';
import { getExchangeRates } from "@/lib/exchangeRates";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        // Fetch User Data for Validation
        const [catsRes, subsRes, accsRes] = await Promise.all([
            query('SELECT id, name FROM categories WHERE user_id = $1 AND deleted_at IS NULL', [session.user.id]),
            query('SELECT id, name, category_id FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE user_id = $1)', [session.user.id]),
            query('SELECT id, name, default_currency FROM accounts WHERE user_id = $1 AND deleted_at IS NULL', [session.user.id])
        ]);

        const categoriesMap = new Map(catsRes.rows.map(c => [c.name.trim().toLowerCase(), c.id]));
        const subcategoriesMap = new Map(subsRes.rows.map(s => [s.name.trim().toLowerCase(), s])); // Store full object to check category match
        const accountsMap = new Map(accsRes.rows.map(a => [a.name.trim().toLowerCase(), a]));

        // DEBUG LOGGING
        console.log("--- DEBUG UPLOAD ---");
        console.log("User ID:", session.user.id);
        console.log("DB Categories:", Array.from(categoriesMap.keys()));

        const results = [];
        const errors = [];
        const skippedRows = [];
        let addedCount = 0;
        let skippedCount = 0;

        // streaming the file
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('error', (err) => reject(err))
                .on('end', () => resolve());
        });

        // Exchange rates for conversion if needed
        const rates = await getExchangeRates();

        const validInserts = [];

        const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowIndex = i + 1; // 1-based index

            const categoryName = (row.category || row.categort || '').trim();
            const subcategoryName = (row.subcategory || '').trim();
            const accountName = (row.account || '').trim();
            const amountStr = (row.amount || '').trim().replace(/,/g, '');
            const currencyStr = (row.currency || 'AMD').trim().toUpperCase();
            const dateStr = (row.date || '').trim();
            const note = (row.note || '').trim();

            let errorReason = null;

            if (!categoryName || !accountName || !amountStr || !dateStr) {
                errorReason = `Missing required fields`;
            } else {
                // Validate Matches
                const searchCategory = categoryName.toLowerCase();
                const categoryId = categoriesMap.get(searchCategory);
                const account = accountsMap.get(accountName.toLowerCase());

                if (!categoryId) {
                    errorReason = `Category '${categoryName}' not found`;
                } else if (!account) {
                    errorReason = `Account '${accountName}' not found`;
                } else {
                    let subcategoryId = null;
                    if (subcategoryName) {
                        const sub = subcategoriesMap.get(subcategoryName.toLowerCase());
                        if (sub && sub.category_id === categoryId) {
                            subcategoryId = sub.id;
                        } else {
                            errorReason = `Subcategory '${subcategoryName}' not found or doesn't match category`;
                        }
                    }

                    if (!errorReason) {
                        // Parse Amount
                        let amountNum = parseFloat(amountStr);
                        if (isNaN(amountNum)) {
                            errorReason = `Invalid amount '${amountStr}'`;
                        } else {
                            // Currency Logic
                            let originalAmount = null;
                            let originalCurrency = null;
                            let finalAmount = amountNum;
                            let finalCurrency = currencyStr;
                            let currencyValid = true;

                            if (currencyStr !== 'AMD') {
                                if (rates[currencyStr]) {
                                    originalAmount = amountNum;
                                    originalCurrency = currencyStr;
                                    finalAmount = amountNum * rates[currencyStr];
                                    finalCurrency = 'AMD';
                                } else {
                                    currencyValid = false;
                                    errorReason = `Unsupported currency '${currencyStr}'`;
                                }
                            }

                            if (currencyValid) {
                                // Parse Date (Normalize to UTC Noon)
                                let date = null;
                                const parts = dateStr.split('-');
                                if (parts.length === 3) {
                                    const day = parseInt(parts[0]);
                                    const monthStr = parts[1].toLowerCase();
                                    const year = parseInt(parts[2]);
                                    if (monthMap.hasOwnProperty(monthStr) && !isNaN(day) && !isNaN(year)) {
                                        date = new Date(Date.UTC(year, monthMap[monthStr], day, 12, 0, 0));
                                    }
                                }
                                if (!date || isNaN(date.getTime())) {
                                    const d = new Date(dateStr);
                                    if (!isNaN(d.getTime())) {
                                        date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
                                    }
                                }

                                if (!date || isNaN(date.getTime())) {
                                    errorReason = `Invalid date '${dateStr}'`;
                                } else {
                                    validInserts.push({
                                        user_email: session.user.email,
                                        amount: finalAmount,
                                        currency: finalCurrency,
                                        category_id: categoryId,
                                        account_id: account.id,
                                        note: note,
                                        subcategory_id: subcategoryId,
                                        original_amount: originalAmount,
                                        original_currency: originalCurrency,
                                        created_at: date.toISOString()
                                    });
                                }
                            }
                        }
                    }
                }
            }

            if (errorReason) {
                skippedCount++;
                skippedRows.push({ ...row, failure_reason: errorReason });
            }
        }

        // Bulk Insert
        if (validInserts.length > 0) {
            await Promise.all(validInserts.map(tx =>
                query(`
                    INSERT INTO transactions (user_email, amount, currency, category_id, account_id, note, subcategory_id, original_amount, original_currency, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    tx.user_email,
                    tx.amount,
                    tx.currency,
                    tx.category_id,
                    tx.account_id,
                    tx.note,
                    tx.subcategory_id,
                    tx.original_amount,
                    tx.original_currency,
                    tx.created_at
                ])
            ));

            addedCount = validInserts.length;
        }

        return NextResponse.json({
            success: true,
            added: addedCount,
            skipped: skippedCount,
            skippedRows: skippedRows
        });

    } catch (error) {
        console.error("Upload error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
