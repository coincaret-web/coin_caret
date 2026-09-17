import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "@/modules/identity/service/auth.service";
import { executeSwap, getSwapQuote } from "@/modules/network/service/swap.service";
import { setPairRate } from "@/modules/market/service/exchange-rate.service";
import { executeTreasuryMint } from "@/modules/admin/service/treasury.service";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Atomic Internal Cross-Asset Swap Engine Database Integration (W-802)", () => {
  let testUserId: string;
  let ccWalletId: string;
  let btcWalletId: string;

  beforeAll(async () => {
    // 1. Ensure assets exist
    for (const asset of SUPPORTED_ASSETS) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: { isActive: true },
        create: {
          symbol: asset.symbol,
          name: asset.name,
          decimals: asset.decimals,
          type: asset.type,
          isActive: true,
        },
      });
    }

    // 2. Register user
    const res = await registerUser({
      email: `swaptrader-${Date.now()}@coincaret.com`,
      password: "TraderPassword123!",
      displayName: "Institutional Trader",
    });
    testUserId = res.user.id;

    // Get user's CC and BTC wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId: testUserId },
      include: { asset: true },
    });

    const ccWallet = wallets.find((w) => w.asset.symbol === "CC");
    const btcWallet = wallets.find((w) => w.asset.symbol === "BTC");

    if (!ccWallet || !btcWallet) {
      throw new Error("Wallets not provisioned properly.");
    }

    ccWalletId = ccWallet.id;
    btcWalletId = btcWallet.id;

    // Mint 1000 CC to user's CC wallet
    await executeTreasuryMint({
      assetSymbol: "CC",
      recipientWalletId: ccWalletId,
      amount: "1000.00000000",
      reason: "Initial funding for swap testing",
      actorUserId: testUserId,
    });

    // Set fixed rate: 1 CC = 0.00000400 BTC
    await setPairRate({
      fromSymbol: "CC",
      toSymbol: "BTC",
      rate: "0.00000400",
      actorUserId: testUserId,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should calculate accurate swap quote with network fees", async () => {
    const quote = await getSwapQuote({
      fromSymbol: "CC",
      toSymbol: "BTC",
      fromAmount: "100.00000000",
    });

    expect(quote.fromSymbol).toBe("CC");
    expect(quote.toSymbol).toBe("BTC");
    expect(quote.rate).toBe("0.00000400");
    expect(quote.toAmount).toBe("0.00040000"); // 100 * 0.00000400
    expect(quote.fee).toBe("0.50000000");
  });

  it("should atomically execute a cross-asset swap, update dual balances and record linked transactions in PostgreSQL", async () => {
    const swapResult = await executeSwap({
      userId: testUserId,
      fromSymbol: "CC",
      toSymbol: "BTC",
      fromAmount: "500.00000000",
      idempotencyKey: `swap-tx-${Date.now()}`,
    });

    expect(swapResult.success).toBe(true);
    expect(swapResult.sourceTransactionId).toBeDefined();
    expect(swapResult.targetTransactionId).toBeDefined();
    expect(swapResult.fromAmount).toBe("500.00000000");
    expect(swapResult.toAmount).toBe("0.00200000"); // 500 * 0.00000400

    // Verify linked transactions in database
    const sourceTx = await prisma.transaction.findUnique({
      where: { id: swapResult.sourceTransactionId },
      include: { linkedTransaction: true, ledgerEntries: true },
    });
    expect(sourceTx?.type).toBe("SWAP");
    expect(sourceTx?.linkedTransactionId).toBe(swapResult.targetTransactionId);

    // Verify User Balances
    const ccBalance = await getWalletBalance(ccWalletId);
    // 1000 - (500 + 0.50 fee) = 499.50 CC
    expect(ccBalance.available.toFixed(8)).toBe("499.50000000");

    const btcBalance = await getWalletBalance(btcWalletId);
    // 0 + 0.00200000 = 0.00200000 BTC
    expect(btcBalance.available.toFixed(8)).toBe("0.00200000");
  });

  it("should reject swap if user has insufficient funds for fromAmount + fee", async () => {
    await expect(
      executeSwap({
        userId: testUserId,
        fromSymbol: "CC",
        toSymbol: "BTC",
        fromAmount: "999999.00000000",
        idempotencyKey: `swap-fail-${Date.now()}`,
      })
    ).rejects.toThrow(/insufficient funds/i);
  });
});
