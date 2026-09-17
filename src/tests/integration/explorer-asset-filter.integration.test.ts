import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getTransactions } from "@/modules/explorer/service/explorer.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Multi-Asset Explorer Filtering Integration (W-705)", () => {
  beforeAll(async () => {
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

    const btcAsset = await prisma.asset.findUnique({ where: { symbol: "BTC" } });
    const ethAsset = await prisma.asset.findUnique({ where: { symbol: "ETH" } });

    // Seed 2 BTC transactions and 1 ETH transaction
    await prisma.transaction.createMany({
      data: [
        {
          txHash: `0xbtctx1${Date.now()}${Math.random().toString(16).slice(2)}`,
          idempotencyKey: `btc-tx-1-${Date.now()}`,
          assetId: btcAsset!.id,
          fromAddress: "BTC0x7a89bc234def567890123456789abcdef0123456",
          toAddress: "BTC0x8b90cd345ef67890123456789abcdef01234567",
          amount: new Decimal("0.05"),
          fee: new Decimal("0.000015"),
          totalDebit: new Decimal("0.050015"),
          status: "CONFIRMED",
        },
        {
          txHash: `0xbtctx2${Date.now()}${Math.random().toString(16).slice(2)}`,
          idempotencyKey: `btc-tx-2-${Date.now()}`,
          assetId: btcAsset!.id,
          fromAddress: "BTC0x7a89bc234def567890123456789abcdef0123456",
          toAddress: "BTC0x9c01de456fa7890123456789abcdef01234568",
          amount: new Decimal("0.02"),
          fee: new Decimal("0.000015"),
          totalDebit: new Decimal("0.020015"),
          status: "CONFIRMED",
        },
        {
          txHash: `0xethtx1${Date.now()}${Math.random().toString(16).slice(2)}`,
          idempotencyKey: `eth-tx-1-${Date.now()}`,
          assetId: ethAsset!.id,
          fromAddress: "ETH0x8b90cd345ef67890123456789abcdef01234567",
          toAddress: "ETH0x9c01de456fa7890123456789abcdef01234568",
          amount: new Decimal("1.5"),
          fee: new Decimal("0.0005"),
          totalDebit: new Decimal("1.5005"),
          status: "CONFIRMED",
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should filter transaction feed by assetSymbol = BTC", async () => {
    const result = await getTransactions({ limit: 10, page: 1, assetSymbol: "BTC" } as any);
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);
    for (const tx of result.transactions) {
      expect(tx?.assetSymbol).toBe("BTC");
    }
  });

  it("should filter transaction feed by assetSymbol = ETH", async () => {
    const result = await getTransactions({ limit: 10, page: 1, assetSymbol: "ETH" } as any);
    expect(result.transactions.length).toBeGreaterThanOrEqual(1);
    for (const tx of result.transactions) {
      expect(tx?.assetSymbol).toBe("ETH");
    }
  });
});
