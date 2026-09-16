import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { internalNetworkEngine } from "@/modules/network/internal-engine/internal.engine";

const sendSchema = z.object({
  fromWalletId: z.string().uuid("Invalid source wallet ID").optional(),
  toAddress: z.string().min(10, "Invalid destination address"),
  amount: z.coerce.number().positive("Transfer amount must be strictly greater than zero"),
  note: z.string().max(255).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const validated = sendSchema.parse(body);

    let resolvedWalletId = validated.fromWalletId;

    if (session?.user && (session.user as any).id) {
      const userId = (session.user as any).id;
      if (!resolvedWalletId) {
        const wallet = await prisma.wallet.findFirst({
          where: { userId },
        });
        if (!wallet) {
          return NextResponse.json({ error: "User wallet not found." }, { status: 404 });
        }
        resolvedWalletId = wallet.id;
      } else {
        // Verify that the requested wallet belongs to the user
        const wallet = await prisma.wallet.findFirst({
          where: { id: resolvedWalletId, userId },
        });
        if (!wallet) {
          return NextResponse.json({ error: "Unauthorized access to specified wallet." }, { status: 403 });
        }
      }
    } else if (!resolvedWalletId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to initiate transfers." }, { status: 401 });
    }

    const idempotencyKey = req.headers.get("Idempotency-Key") || `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const result = await internalNetworkEngine.broadcastTx({
      fromWalletId: resolvedWalletId,
      toAddress: validated.toAddress,
      amount: validated.amount,
      note: validated.note,
      idempotencyKey,
      initiatorUserId: (session?.user as any)?.id,
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

