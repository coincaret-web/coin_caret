import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { ensureAllWalletsForUser } from "@/modules/wallets/service/wallet.service";
import { AssetWalletSummary } from "@/types/wallet";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Ensure all 8 asset wallets exist for this user
    const userWallets = await ensureAllWalletsForUser(userId);

    if (!userWallets || userWallets.length === 0) {
      return NextResponse.json({ error: "No wallet found for user" }, { status: 404 });
    }


    // Process all wallets
    const walletSummaries: AssetWalletSummary[] = [];
    const allAddresses: string[] = [];

    for (const w of userWallets) {
      const balances = await getWalletBalance(w.id);
      const addr = w.addresses[0]?.address ?? "";
      if (addr) allAddresses.push(addr);

      walletSummaries.push({
        walletId: w.id,
        assetSymbol: w.asset.symbol,
        assetName: w.asset.name,
        decimals: w.asset.decimals,
        address: addr,
        availableBalance: balances.available.toFixed(8),
        reservedBalance: balances.reserved.toFixed(8),
        totalBalance: balances.total.toFixed(8),
      });
    }

    // Default primary wallet is CC, or the first wallet
    const primaryWallet =
      userWallets.find((w) => w.asset.symbol === "CC") || userWallets[0];
    const primarySummary =
      walletSummaries.find((s) => s.assetSymbol === "CC") || walletSummaries[0];

    // Fetch recent transactions involving any of this user's wallet addresses or initiated by user
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: { in: allAddresses } },
          { toAddress: { in: allAddresses } },
          { initiatorUserId: userId },
        ],
      },
      include: {
        asset: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      walletId: primaryWallet.id,
      address: primarySummary.address,
      assetSymbol: primarySummary.assetSymbol,
      assetName: primarySummary.assetName,
      availableBalance: primarySummary.availableBalance,
      reservedBalance: primarySummary.reservedBalance,
      totalBalance: primarySummary.totalBalance,
      wallets: walletSummaries,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        txHash: tx.txHash,
        type: tx.type,
        assetSymbol: tx.asset?.symbol || "CC",
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
