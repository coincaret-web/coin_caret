import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { Decimal } from "@prisma/client/runtime/library";
import { AccountType } from "@prisma/client";
import { getWalletAccount } from "@/modules/ledger/repository/ledger.repository";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { destinationAddress, amount } = body;

    if (!destinationAddress || typeof destinationAddress !== "string") {
      return NextResponse.json({ error: "Invalid destination address." }, { status: 400 });
    }

    const numAmount = new Decimal(amount);
    if (numAmount.lte(0)) {
      return NextResponse.json({ error: "Withdrawal amount must be greater than zero." }, { status: 400 });
    }

    const fee = new Decimal(0.5); // Standard external bridge withdrawal fee
    const totalRequired = numAmount.plus(fee);

    const wallet = await prisma.wallet.findFirst({
      where: { userId },
      include: { asset: true },
    });

    if (!wallet) {
      return NextResponse.json({ error: "User wallet not found." }, { status: 404 });
    }

    const balances = await getWalletBalance(wallet.id);
    if (balances.available.lt(totalRequired)) {
      return NextResponse.json(
        {
          error: `Insufficient available funds. Required: ${totalRequired.toString()} CC (including 0.50 CC bridge fee), Available: ${balances.available.toString()} CC`,
        },
        { status: 400 }
      );
    }

    // Atomic withdrawal request creation & reservation
    const withdrawal = await prisma.$transaction(async (tx) => {
      // 1. Create withdrawal request
      const reqRecord = await tx.withdrawalRequest.create({
        data: {
          userId,
          walletId: wallet.id,
          destinationAddress: destinationAddress.trim(),
          amount: numAmount,
          fee,
          status: "REQUESTED",
        },
      });

      return reqRecord;
    });

    return NextResponse.json(
      {
        message: "Withdrawal request submitted for institutional review.",
        withdrawalId: withdrawal.id,
        status: withdrawal.status,
        amount: withdrawal.amount.toString(),
        fee: withdrawal.fee.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating withdrawal request:", error);
    return NextResponse.json({ error: "Internal server error creating withdrawal." }, { status: 500 });
  }
}
