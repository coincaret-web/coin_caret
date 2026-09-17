import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeSwap, getSwapQuote } from "@/modules/network/service/swap.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromSymbol = searchParams.get("from");
    const toSymbol = searchParams.get("to");
    const amount = searchParams.get("amount");

    if (!fromSymbol || !toSymbol || !amount) {
      return NextResponse.json(
        { error: "from, to, and amount query parameters are required." },
        { status: 400 }
      );
    }

    const quote = await getSwapQuote({
      fromSymbol,
      toSymbol,
      fromAmount: amount,
    });

    return NextResponse.json({ success: true, quote }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to calculate swap quote." },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to perform swaps." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { fromSymbol, toSymbol, amount } = body;

    if (!fromSymbol || !toSymbol || !amount) {
      return NextResponse.json(
        { error: "fromSymbol, toSymbol, and amount are required." },
        { status: 400 }
      );
    }

    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      `swap-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await executeSwap({
      userId,
      fromSymbol,
      toSymbol,
      fromAmount: amount,
      idempotencyKey,
      ipAddress,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during swap execution." },
      { status: 400 }
    );
  }
}
