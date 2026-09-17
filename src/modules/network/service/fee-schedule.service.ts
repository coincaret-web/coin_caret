import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const DEFAULT_FEES: Record<string, string> = {
  CC: "0.50",
  BTC: "0.000015",
  ETH: "0.0005",
  SOL: "0.0005",
  BNB: "0.0005",
  LTC: "0.001",
  XRP: "0.1",
  DOGE: "1.0",
};

/**
 * Resolves the gas fee for a given asset symbol from NetworkSetting table with fallback.
 */
export async function getFeeForAsset(assetSymbol: string): Promise<Decimal> {
  const sym = (assetSymbol || "CC").toUpperCase();
  const settingKey = `FEE_${sym}`;

  try {
    const setting = await prisma.networkSetting.findUnique({
      where: { key: settingKey },
    });

    if (setting && setting.value) {
      const parsed = new Decimal(setting.value);
      if (parsed.gte(0)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`[FeeSchedule] Failed to fetch fee setting for ${settingKey}, falling back to defaults:`, err);
  }

  const fallbackStr = DEFAULT_FEES[sym] || "0.001";
  return new Decimal(fallbackStr);
}
