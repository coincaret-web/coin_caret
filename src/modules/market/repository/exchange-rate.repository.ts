import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function findPairRate(fromAssetId: string, toAssetId: string) {
  return prisma.assetPairRate.findUnique({
    where: {
      fromAssetId_toAssetId: {
        fromAssetId,
        toAssetId,
      },
    },
    include: {
      fromAsset: true,
      toAsset: true,
      setByUser: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  });
}

export async function upsertPairRate(input: {
  fromAssetId: string;
  toAssetId: string;
  rate: Decimal | string | number;
  setByUserId?: string;
}) {
  const rateDecimal = new Decimal(input.rate);

  return prisma.assetPairRate.upsert({
    where: {
      fromAssetId_toAssetId: {
        fromAssetId: input.fromAssetId,
        toAssetId: input.toAssetId,
      },
    },
    update: {
      rate: rateDecimal,
      setByUserId: input.setByUserId,
    },
    create: {
      fromAssetId: input.fromAssetId,
      toAssetId: input.toAssetId,
      rate: rateDecimal,
      setByUserId: input.setByUserId,
    },
    include: {
      fromAsset: true,
      toAsset: true,
    },
  });
}

export async function findAllPairRates() {
  return prisma.assetPairRate.findMany({
    include: {
      fromAsset: true,
      toAsset: true,
      setByUser: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}
