import { NextRequest, NextResponse } from "next/server";
import { getTransactionDetails } from "@/modules/explorer/service/explorer.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const hash = params?.hash;

    if (!hash) {
      return NextResponse.json(
        { error: "Transaction hash is required" },
        { status: 400 }
      );
    }

    const tx = await getTransactionDetails(hash);

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tx, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/tx/[hash] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details", details: error.message },
      { status: 500 }
    );
  }
}
