import { NextRequest, NextResponse } from "next/server";
import { getAddressDetails } from "@/modules/explorer/service/explorer.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params?.address;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    const data = await getAddressDetails(address, { limit, page });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/explorer/address/[address] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch address details", details: error.message },
      { status: 500 }
    );
  }
}
