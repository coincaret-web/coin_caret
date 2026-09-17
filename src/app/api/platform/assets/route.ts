import { NextResponse } from "next/server";
import { getActiveAssets } from "@/modules/market/service/asset-registry.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assets = await getActiveAssets();
    return NextResponse.json({
      success: true,
      assets,
    });
  } catch (error: any) {
    console.error("[GET /api/platform/assets] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve active assets" },
      { status: 500 }
    );
  }
}
