import { NextRequest, NextResponse } from "next/server";
import { getOrRefreshCryptoPrices } from "@/modules/market/service/price-feed.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const result = await getOrRefreshCryptoPrices();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve cryptocurrency price feeds." },
      { status: 500 }
    );
  }
}
