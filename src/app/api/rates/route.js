import { getExchangeRates } from "@/lib/exchangeRates";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const rates = await getExchangeRates();
        return NextResponse.json(rates);
    } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        return NextResponse.json(
            { USD: 400, EUR: 420 }, // Fallback rates
            { status: 500 }
        );
    }
}
