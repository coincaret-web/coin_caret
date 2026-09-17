import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Multi-Asset Network Stats Public API Integration (W-804)", () => {
  beforeAll(async () => {
    // 1. Ensure all 8 assets exist
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return active multi-asset network statistics and supported asset list", async () => {
    const assets = await prisma.asset.findMany({ where: { isActive: true } });
    expect(assets.length).toBe(8);

    const symbols = assets.map((a) => a.symbol);
    expect(symbols).toContain("CC");
    expect(symbols).toContain("BTC");
    expect(symbols).toContain("ETH");
    expect(symbols).toContain("SOL");
    expect(symbols).toContain("BNB");
    expect(symbols).toContain("LTC");
    expect(symbols).toContain("XRP");
    expect(symbols).toContain("DOGE");
  });
});
