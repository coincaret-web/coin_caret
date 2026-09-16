import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find primary wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId },
      include: {
        addresses: true,
        asset: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "No wallet found for user" }, { status: 404 });
    }

    // Derive balances
    const balances = await getWalletBalance(wallet.id);

    // Fetch recent transactions involving this wallet's addresses
    const primaryAddress = wallet.addresses[0]?.address ?? "";
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: primaryAddress },
          { toAddress: primaryAddress },
          { initiatorUserId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      walletId: wallet.id,
      address: primaryAddress,
      assetSymbol: wallet.asset.symbol,
      assetName: wallet.asset.name,
      availableBalance: balances.available.toFixed(8),
      reservedBalance: balances.reserved.toFixed(8),
      totalBalance: balances.total.toFixed(8),
      transactions: transactions.map((tx) => ({
        id: tx.id,
        txHash: tx.txHash,
        type: tx.type,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        amount: tx.amount.toFixed(8),
        fee: tx.fee.toFixed(8),
        status: tx.status,
        confirmations: tx.confirmations,
        blockHeight: tx.blockHeight ? Number(tx.blockHeight) : null,
        createdAt: tx.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching wallet summary:", error);
    return NextResponse.json(
      { error: "Internal server error fetching wallet summary" },
      { status: 500 }
    );
  }
}
