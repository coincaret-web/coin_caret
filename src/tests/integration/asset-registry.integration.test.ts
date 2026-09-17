import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getActiveAssets, SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Asset Registry Database Integration (W-701)", () => {
  beforeAll(async () => {
    // Upsert all 8 supported assets
    for (const asset of SUPPORTED_ASSETS) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: {
          name: asset.name,
          decimals: asset.decimals,
          type: asset.type,
          isActive: true,
        },
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

  it("should have all 8 supported asset rows in the PostgreSQL database", async () => {
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { symbol: "asc" },
    });

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

  it("should retrieve active assets through getActiveAssets service", async () => {
    const assets = await getActiveAssets();
    expect(assets.length).toBe(8);
    const cc = assets.find((a) => a.symbol === "CC");
    expect(cc).toBeDefined();
    expect(cc?.decimals).toBe(8);
    expect(cc?.type).toBe("NATIVE_COIN");
  });

  it("should be idempotent and not create duplicate rows on re-run", async () => {
    for (const asset of SUPPORTED_ASSETS) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: {},
        create: {
          symbol: asset.symbol,
          name: asset.name,
          decimals: asset.decimals,
          type: asset.type,
          isActive: true,
        },
      });
    }

    const count = await prisma.asset.count();
    expect(count).toBe(8);
  });
});
