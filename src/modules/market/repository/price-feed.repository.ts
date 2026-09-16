import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function upsertPriceFeedCache(data: {
  coinId: string;
  symbol: string;
  name: string;
  usdPrice: Decimal | string | number;
}) {
  const priceDec = new Decimal(data.usdPrice);
  return prisma.externalPriceFeedCache.upsert({
    where: { coinId: data.coinId },
    update: {
      usdPrice: priceDec,
      fetchedAt: new Date(),
    },
    create: {
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      usdPrice: priceDec,
      fetchedAt: new Date(),
    },
  });
}

export async function findAllCachedPrices() {
  return prisma.externalPriceFeedCache.findMany({
    orderBy: { coinId: "asc" },
  });
}

export async function findCachedPriceByCoinId(coinId: string) {
  return prisma.externalPriceFeedCache.findUnique({
    where: { coinId },
  });
}
