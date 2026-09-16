import { NextRequest, NextResponse } from "next/server";
import { getBlockDetails } from "@/modules/explorer/service/explorer.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { height: string } }
) {
  try {
    const height = params?.height;

    if (!height) {
      return NextResponse.json(
        { error: "Block height or hash is required" },
        { status: 400 }
      );
    }

    const block = await getBlockDetails(height);

    if (!block) {
      return NextResponse.json(
        { error: "Block not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(block, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/block/[height] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch block details", details: error.message },
      { status: 500 }
    );
  }
}
