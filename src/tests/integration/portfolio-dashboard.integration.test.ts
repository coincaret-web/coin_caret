import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "@/modules/identity/service/auth.service";
import { getUserPortfolioSummary } from "@/modules/wallets/service/portfolio.service";
import { executeTreasuryMint } from "@/modules/admin/service/treasury.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Multi-Currency Portfolio Aggregation Database Integration (W-803)", () => {
  let testUserId: string;

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
      email: `portfolio-holder-${Date.now()}@coincaret.com`,
      password: "PortfolioPassword123!",
      displayName: "Institutional Fund Manager",
    });
    testUserId = res.user.id;

    // Get user's CC and ETH wallets
    const wallets = await prisma.wallet.findMany({
      where: { userId: testUserId },
      include: { asset: true },
    });

    const ccWallet = wallets.find((w) => w.asset.symbol === "CC");
    const ethWallet = wallets.find((w) => w.asset.symbol === "ETH");

    if (ccWallet && ethWallet) {
      // Mint 20,000 CC ($5,000 @ $0.25)
      await executeTreasuryMint({
        assetSymbol: "CC",
        recipientWalletId: ccWallet.id,
        amount: "20000.00000000",
        reason: "Portfolio initial CC allocation",
        actorUserId: testUserId,
      });

      // Mint 2 ETH ($6,800 @ $3400)
      await executeTreasuryMint({
        assetSymbol: "ETH",
        recipientWalletId: ethWallet.id,
        amount: "2.00000000",
        reason: "Portfolio initial ETH allocation",
        actorUserId: testUserId,
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should aggregate all 8 asset balances, resolve USD valuations, and calculate net worth in PostgreSQL", async () => {
    const portfolio = await getUserPortfolioSummary(testUserId);

    expect(portfolio.assets).toHaveLength(8);
    expect(parseFloat(portfolio.totalPortfolioUsdValue)).toBeGreaterThan(0);

    const ccAsset = portfolio.assets.find((a) => a.symbol === "CC");
    expect(ccAsset).toBeDefined();
    expect(ccAsset?.availableBalance).toBe("20000.00000000");
    expect(parseFloat(ccAsset?.usdValue || "0")).toBe(5000);

    const ethAsset = portfolio.assets.find((a) => a.symbol === "ETH");
    expect(ethAsset).toBeDefined();
    expect(ethAsset?.availableBalance).toBe("2.00000000");
    const expectedEthUsd = (2.0 * parseFloat(ethAsset?.usdPrice || "0")).toFixed(2);
    expect(ethAsset?.usdValue).toBe(expectedEthUsd);

    // Verify percentages sum to ~100%
    const totalPct = portfolio.assets.reduce(
      (sum, a) => sum + parseFloat(a.allocationPercentage),
      0
    );
    expect(Math.round(totalPct)).toBe(100);
  });
});
