import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { Readable } from 'stream';
import csv from 'csv-parser';
import { getExchangeRates, convertCurrency } from "@/lib/exchangeRates";

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
            query('SELECT id, name FROM categories WHERE user_id = $1', [session.user.id]),
            query('SELECT id, name, category_id FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE user_id = $1)', [session.user.id]),
            query('SELECT id, name, default_currency FROM accounts WHERE user_id = $1', [session.user.id])
        ]);

        const categoriesMap = new Map(catsRes.rows.map(c => [c.name.trim().toLowerCase(), c.id]));
        // Use composite key: category_id-subcategory_name to handle duplicate subcategory names across categories
        const subcategoriesMap = new Map(
            subsRes.rows.map(s => [`${s.category_id}-${s.name.trim().toLowerCase()}`, s])
        );
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
                        // Use composite key with category_id from the row to find the correct subcategory
                        const compositeKey = `${categoryId}-${subcategoryName.toLowerCase()}`;
                        const sub = subcategoriesMap.get(compositeKey);
                        if (sub) {
                            subcategoryId = sub.id;
                        } else {
                            errorReason = `Subcategory '${subcategoryName}' not found under category '${categoryName}'`;
                        }
                    }

                    if (!errorReason) {
                        // Parse Amount
                        let amountNum = parseFloat(amountStr);
                        if (isNaN(amountNum)) {
                            errorReason = `Invalid amount '${amountStr}'`;
                        } else {
                            // Get account currency
                            const accountCurrency = account.default_currency || 'USD';
                            
                            // Currency Logic - Always use account currency
                            let finalAmount = amountNum;
                            let finalCurrency = accountCurrency;
                            let currencyValid = true;

                            // If CSV currency differs from account currency, convert to account currency
                            if (currencyStr && currencyStr !== accountCurrency) {
                                if (rates[currencyStr] && rates[accountCurrency]) {
                                    // Convert to account currency using the same logic as convertCurrency
                                    const amountInUSD = amountNum / rates[currencyStr];
                                    finalAmount = amountInUSD * rates[accountCurrency];
                                    finalCurrency = accountCurrency;
                                } else {
                                    currencyValid = false;
                                    errorReason = `Unsupported currency '${currencyStr}' or account currency '${accountCurrency}'`;
                                }
                            }
                            // If currency matches account currency, use as-is

                            if (currencyValid) {
                                // Parse Date - Support YYYY-MM-DD HH:MM:SS format
                                let date = null;
                                
                                // Try parsing YYYY-MM-DD HH:MM:SS format first
                                const dateTimeMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
                                if (dateTimeMatch) {
                                    const [, year, month, day, hours, minutes, seconds] = dateTimeMatch;
                                    date = new Date(Date.UTC(
                                        parseInt(year),
                                        parseInt(month) - 1,
                                        parseInt(day),
                                        parseInt(hours),
                                        parseInt(minutes),
                                        parseInt(seconds)
                                    ));
                                } else {
                                    // Try parsing YYYY-MM-DD format (without time)
                                    const dateOnlyMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                    if (dateOnlyMatch) {
                                        const [, year, month, day] = dateOnlyMatch;
                                        date = new Date(Date.UTC(
                                            parseInt(year),
                                            parseInt(month) - 1,
                                            parseInt(day),
                                            12, 0, 0
                                        ));
                                    } else {
                                        // Fallback: Try old DD-Mon-YYYY format for backward compatibility
                                        const parts = dateStr.split('-');
                                        if (parts.length === 3) {
                                            const day = parseInt(parts[0]);
                                            const monthStr = parts[1].toLowerCase();
                                            const year = parseInt(parts[2]);
                                            if (monthMap.hasOwnProperty(monthStr) && !isNaN(day) && !isNaN(year)) {
                                                date = new Date(Date.UTC(year, monthMap[monthStr], day, 12, 0, 0));
                                            }
                                        }
                                        // Final fallback: Try native Date parsing
                                        if (!date || isNaN(date.getTime())) {
                                            const d = new Date(dateStr);
                                            if (!isNaN(d.getTime())) {
                                                date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
                                            }
                                        }
                                    }
                                }

                                if (!date || isNaN(date.getTime())) {
                                    errorReason = `Invalid date '${dateStr}'. Expected format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD`;
                                } else {
                                    validInserts.push({
                                        user_id: session.user.id,
                                        amount: finalAmount,
                                        currency: finalCurrency,
                                        category_id: categoryId,
                                        account_id: account.id,
                                        note: note,
                                        subcategory_id: subcategoryId,
                                        exchange_rate: JSON.stringify(rates), // Store exchange rates at import time
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
                    INSERT INTO transactions (user_id, amount, currency, category_id, account_id, note, subcategory_id, exchange_rate, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    tx.user_id,
                    tx.amount,
                    tx.currency,
                    tx.category_id,
                    tx.account_id,
                    tx.note,
                    tx.subcategory_id,
                    tx.exchange_rate,
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
        console.error("Upload error stack:", error.stack);
        return NextResponse.json(
            { error: error.message || "Internal Server Error", details: process.env.NODE_ENV === 'development' ? error.stack : undefined },
            { status: 500 }
        );
    }
}
