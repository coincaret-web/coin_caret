import { NextRequest, NextResponse } from "next/server";
import { getExplorerStats } from "@/modules/explorer/service/explorer.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const stats = await getExplorerStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch explorer stats", details: error.message },
      { status: 500 }
    );
  }
}
