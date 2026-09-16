import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/modules/explorer/service/explorer.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const data = await getTransactions({ limit, page });
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/transactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error.message },
      { status: 500 }
    );
  }
}
