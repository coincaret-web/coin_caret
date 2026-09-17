import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { internalNetworkEngine } from "@/modules/network/internal-engine/internal.engine";
import { resolveWalletForSend } from "@/modules/wallets/service/wallet-resolver.service";

const sendSchema = z.object({
  /** Optional: explicit wallet UUID. Takes precedence over assetSymbol. */
  fromWalletId: z.string().uuid("Invalid source wallet ID").optional(),
  /** Optional: asset symbol (e.g., "BTC", "ETH"). Used to resolve the correct wallet. */
  assetSymbol: z.string().min(1).max(10).optional(),
  toAddress: z.string().min(10, "Invalid destination address"),
  amount: z.coerce.number().positive("Transfer amount must be strictly greater than zero"),
  note: z.string().max(255).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to initiate transfers." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const validated = sendSchema.parse(body);

    // Resolve the correct wallet using the multi-asset resolver
    const resolvedWallet = await resolveWalletForSend({
      userId,
      fromWalletId: validated.fromWalletId,
      assetSymbol: validated.assetSymbol,
    });

    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const result = await internalNetworkEngine.broadcastTx({
      fromWalletId: resolvedWallet.id,
      toAddress: validated.toAddress,
      amount: validated.amount,
      note: validated.note,
      idempotencyKey,
      initiatorUserId: userId,
    });

    return NextResponse.json(
      {
        message: "Transaction broadcasted to mempool",
        assetSymbol: resolvedWallet.asset.symbol,
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Invalid input parameters" },
        { status: 400 }
      );
    }

    // Surface auth/ownership errors as 403
    if (error.message?.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during transfer submission." },
      { status: 400 }
    );
  }
}
