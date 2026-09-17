import { NextRequest, NextResponse } from "next/server";
import { getRateForPair, getAllExchangeRates } from "@/modules/market/service/exchange-rate.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromSymbol = searchParams.get("from");
    const toSymbol = searchParams.get("to");

    if (fromSymbol && toSymbol) {
      const rateData = await getRateForPair(fromSymbol, toSymbol);
      return NextResponse.json(
        {
          success: true,
          fromSymbol: rateData.fromSymbol,
          toSymbol: rateData.toSymbol,
          rate: rateData.rate.toFixed(8),
          isCustomAdminRate: rateData.isCustomAdminRate,
        },
        { status: 200 }
      );
    }

    const rates = await getAllExchangeRates();
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve exchange rates." },
      { status: 500 }
    );
  }
}
