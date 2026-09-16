import { NextRequest, NextResponse } from "next/server";
import { getCcUsdRate } from "@/modules/admin/service/platform-config.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rateData = await getCcUsdRate();
    return NextResponse.json(rateData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve CC/USD rate." },
      { status: 500 }
    );
  }
}
