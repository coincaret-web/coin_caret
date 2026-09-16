import { NextRequest, NextResponse } from "next/server";
import { resolveUniversalSearch } from "@/modules/explorer/service/explorer.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const result = await resolveUniversalSearch(query);

    if (!result.found) {
      return NextResponse.json(
        { error: result.error || "Entity not found", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search", details: error.message },
      { status: 500 }
    );
  }
}
