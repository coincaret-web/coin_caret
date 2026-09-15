import { NextResponse } from "next/server";
import { z } from "zod";
import { internalNetworkEngine } from "@/modules/network/internal-engine/internal.engine";

const sendSchema = z.object({
  fromWalletId: z.string().uuid("Invalid source wallet ID"),
  toAddress: z.string().min(10, "Invalid destination address"),
  amount: z.coerce.number().positive("Transfer amount must be strictly greater than zero"),
  note: z.string().max(255).optional(),
});

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get("Idempotency-Key") || `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const body = await req.json();
    const validated = sendSchema.parse(body);

    const result = await internalNetworkEngine.broadcastTx({
      fromWalletId: validated.fromWalletId,
      toAddress: validated.toAddress,
      amount: validated.amount,
      note: validated.note,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        message: "Transaction broadcasted to mempool",
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

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during transfer submission." },
      { status: 400 }
    );
  }
}
