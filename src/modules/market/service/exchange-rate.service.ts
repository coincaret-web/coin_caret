import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  findPairRate,
  upsertPairRate,
  findAllPairRates,
} from "../repository/exchange-rate.repository";
import { getOrRefreshCryptoPrices, SUPPORTED_COINS } from "./price-feed.service";
import { getCcUsdRate } from "@/modules/admin/service/platform-config.service";
import { AssetPairRateDto } from "@/types/market";
import { SUPPORTED_ASSETS } from "./asset-registry.service";

export function computeCrossRate(
  fromUsdPrice: Decimal | string | number,
  toUsdPrice: Decimal | string | number
): Decimal {
  const fromDec = new Decimal(fromUsdPrice);
  const toDec = new Decimal(toUsdPrice);

  if (toDec.lte(0)) {
    throw new Error("Target asset USD price must be strictly greater than zero.");
  }

  return fromDec.dividedBy(toDec);
}

export function sanitizePairRateInput(rateInput: string | number | Decimal): Decimal {
  if (rateInput === undefined || rateInput === null || String(rateInput).trim().length === 0) {
    throw new Error("Rate must be a valid numeric value.");
  }

  let dec: Decimal;
  try {
    dec = new Decimal(rateInput);
  } catch {
    throw new Error("Rate must be a valid numeric value.");
  }

  if (dec.isNaN()) {
    throw new Error("Rate must be a valid numeric value.");
  }

  if (dec.lte(0)) {
    throw new Error("Rate must be strictly greater than zero.");
  }

  return dec;
}

async function getUsdPriceForSymbol(symbol: string): Promise<Decimal> {
  const normSymbol = symbol.toUpperCase();
  if (normSymbol === "CC") {
    const ccRate = await getCcUsdRate();
    return new Decimal(ccRate.rate || "0.25");
  }

  const { prices } = await getOrRefreshCryptoPrices();
  const coinDef = SUPPORTED_COINS.find((c) => c.symbol.toUpperCase() === normSymbol);
  if (coinDef && prices[coinDef.id]) {
    return new Decimal(prices[coinDef.id].usdPrice || coinDef.fallbackPrice);
  }

  const assetDef = SUPPORTED_ASSETS.find((a) => a.symbol.toUpperCase() === normSymbol);
  if (assetDef?.fallbackPrice) {
    return new Decimal(assetDef.fallbackPrice);
  }

  return new Decimal("1.00");
}

export async function getRateForPair(
  fromSymbol: string,
  toSymbol: string
): Promise<{
  rate: Decimal;
  isCustomAdminRate: boolean;
  fromSymbol: string;
  toSymbol: string;
}> {
  const normFrom = fromSymbol.toUpperCase();
  const normTo = toSymbol.toUpperCase();

  if (normFrom === normTo) {
    return {
      rate: new Decimal("1.00000000"),
      isCustomAdminRate: false,
      fromSymbol: normFrom,
      toSymbol: normTo,
    };
  }

  const [fromAsset, toAsset] = await Promise.all([
    prisma.asset.findUnique({ where: { symbol: normFrom } }),
    prisma.asset.findUnique({ where: { symbol: normTo } }),
  ]);

  if (fromAsset && toAsset) {
    const customRate = await findPairRate(fromAsset.id, toAsset.id);
    if (customRate) {
      return {
        rate: customRate.rate,
        isCustomAdminRate: true,
        fromSymbol: normFrom,
        toSymbol: normTo,
      };
    }
  }

  // Fallback: compute cross-rate via USD price bridge
  const [fromUsd, toUsd] = await Promise.all([
    getUsdPriceForSymbol(normFrom),
    getUsdPriceForSymbol(normTo),
  ]);

  const crossRate = computeCrossRate(fromUsd, toUsd);

  return {
    rate: crossRate,
    isCustomAdminRate: false,
    fromSymbol: normFrom,
    toSymbol: normTo,
  };
}

export async function setPairRate(input: {
  fromSymbol: string;
  toSymbol: string;
  rate: string | number | Decimal;
  actorUserId?: string;
  ipAddress?: string;
}): Promise<AssetPairRateDto> {
  const normFrom = input.fromSymbol.toUpperCase();
  const normTo = input.toSymbol.toUpperCase();

  if (normFrom === normTo) {
    throw new Error("From and To assets cannot be the same.");
  }

  const validatedRate = sanitizePairRateInput(input.rate);

  const [fromAsset, toAsset] = await Promise.all([
    prisma.asset.findUnique({ where: { symbol: normFrom } }),
    prisma.asset.findUnique({ where: { symbol: normTo } }),
  ]);

  if (!fromAsset) {
    throw new Error(`Source asset ${normFrom} not found.`);
  }
  if (!toAsset) {
    throw new Error(`Target asset ${normTo} not found.`);
  }

  const beforeRate = await findPairRate(fromAsset.id, toAsset.id);

  const updated = await upsertPairRate({
    fromAssetId: fromAsset.id,
    toAssetId: toAsset.id,
    rate: validatedRate,
    setByUserId: input.actorUserId,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId || null,
      action: "SET_EXCHANGE_RATE",
      entityType: "AssetPairRate",
      entityId: `${normFrom}_${normTo}`,
      beforeState: beforeRate
        ? { from: normFrom, to: normTo, rate: beforeRate.rate.toFixed(8) }
        : Prisma.JsonNull,
      afterState: { from: normFrom, to: normTo, rate: validatedRate.toFixed(8) },
      ipAddress: input.ipAddress || null,
    },
  });

  return {
    id: updated.id,
    fromSymbol: normFrom,
    toSymbol: normTo,
    rate: updated.rate.toFixed(8),
    isCustomAdminRate: true,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function getAllExchangeRates(): Promise<AssetPairRateDto[]> {
  const customRates = await findAllPairRates();

  return customRates.map((r) => ({
    id: r.id,
    fromSymbol: r.fromAsset.symbol,
    toSymbol: r.toAsset.symbol,
    rate: r.rate.toFixed(8),
    isCustomAdminRate: true,
    updatedAt: r.updatedAt.toISOString(),
  }));
}
