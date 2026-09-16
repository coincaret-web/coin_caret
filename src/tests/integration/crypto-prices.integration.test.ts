import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/platform/crypto-prices/route";
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

describe("CoinGecko Price Feed & Cache Integration (W-604)", () => {
  beforeAll(async () => {
    await prisma.$connect();
    // Clear price cache
    await prisma.externalPriceFeedCache.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("serves cached prices when cache is fresh (< 60s)", async () => {
    // Seed fresh cache entries for all 7 coins
    const coins = [
      { coinId: "bitcoin", symbol: "BTC", name: "Bitcoin", usdPrice: 65000 },
      { coinId: "ethereum", symbol: "ETH", name: "Ethereum", usdPrice: 3400 },
      { coinId: "solana", symbol: "SOL", name: "Solana", usdPrice: 145 },
      { coinId: "binancecoin", symbol: "BNB", name: "BNB", usdPrice: 560 },
      { coinId: "litecoin", symbol: "LTC", name: "Litecoin", usdPrice: 68 },
      { coinId: "ripple", symbol: "XRP", name: "XRP", usdPrice: 0.58 },
      { coinId: "dogecoin", symbol: "DOGE", name: "Dogecoin", usdPrice: 0.11 },
    ];

    for (const c of coins) {
      await prisma.externalPriceFeedCache.upsert({
        where: { coinId: c.coinId },
        update: { usdPrice: new Decimal(c.usdPrice), fetchedAt: new Date(Date.now() - 15000) },
        create: {
          coinId: c.coinId,
          symbol: c.symbol,
          name: c.name,
          usdPrice: new Decimal(c.usdPrice),
          fetchedAt: new Date(Date.now() - 15000),
        },
      });
    }

    const req = new NextRequest("http://127.0.0.1:3847/api/platform/crypto-prices");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.prices).toBeDefined();
    expect(body.prices.bitcoin).toBeDefined();
    expect(Number(body.prices.bitcoin.usdPrice)).toBe(65000);
    expect(body.isStale).toBe(false);
  });

  it("returns price map for all 7 supported cryptocurrencies (BTC, ETH, SOL, BNB, LTC, XRP, DOGE)", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/platform/crypto-prices");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.prices.bitcoin).toBeDefined();
    expect(body.prices.ethereum).toBeDefined();
    expect(body.prices.solana).toBeDefined();
    expect(body.prices.binancecoin).toBeDefined();
    expect(body.prices.litecoin).toBeDefined();
    expect(body.prices.ripple).toBeDefined();
    expect(body.prices.dogecoin).toBeDefined();
  });

  it("handles offline / fallback gracefully without crashing", async () => {
    // When external API is mocked or unreachable, it uses cache or fallback values
    const req = new NextRequest("http://127.0.0.1:3847/api/platform/crypto-prices");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body.prices).length).toBe(7);
  });
});
