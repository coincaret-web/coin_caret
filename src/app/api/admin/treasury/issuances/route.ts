import { NextRequest, NextResponse } from "next/server";
import { getRecentIssuances } from "@/modules/admin/service/treasury.service";

export async function GET(req: NextRequest) {
  try {
    const issuances = await getRecentIssuances(50);
    return NextResponse.json({ issuances }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch issuances" }, { status: 500 });
  }
}
