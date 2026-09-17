import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "@/modules/identity/service/auth.service";
import { getRateForPair, setPairRate, getAllExchangeRates } from "@/modules/market/service/exchange-rate.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Cross-Asset Exchange Rate Matrix Database Integration (W-801)", () => {
  let adminUserId: string;

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

    const admin = await registerUser({
      email: `exchangemaster-${Date.now()}@coincaret.com`,
      password: "AdminPassword123!",
      displayName: "FX Exchange Master",
    });
    adminUserId = admin.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should set and retrieve custom admin-defined pair rate in PostgreSQL", async () => {
    const customRate = "0.00000400";
    await setPairRate({
      fromSymbol: "CC",
      toSymbol: "BTC",
      rate: customRate,
      actorUserId: adminUserId,
    });

    const rateResult = await getRateForPair("CC", "BTC");
    expect(rateResult.rate.toFixed(8)).toBe("0.00000400");
    expect(rateResult.isCustomAdminRate).toBe(true);

    // Verify in database
    const allRates = await getAllExchangeRates();
    const ccBtc = allRates.find((r: { fromSymbol: string; toSymbol: string }) => r.fromSymbol === "CC" && r.toSymbol === "BTC");
    expect(ccBtc).toBeDefined();
    expect(ccBtc?.rate).toBe("0.00000400");
  });

  it("should calculate CoinGecko price bridge cross-rate when no custom rate exists", async () => {
    const rateResult = await getRateForPair("ETH", "SOL");
    expect(rateResult.rate.gt(0)).toBe(true);
    expect(rateResult.isCustomAdminRate).toBe(false);
  });

  it("should reject setting pair rate for identical from and to assets", async () => {
    await expect(
      setPairRate({
        fromSymbol: "CC",
        toSymbol: "CC",
        rate: "1.00",
        actorUserId: adminUserId,
      })
    ).rejects.toThrow(/cannot be the same/i);
  });
});
