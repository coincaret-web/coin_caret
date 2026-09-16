import { prisma } from "@/lib/prisma";
import { findPlatformConfigByKey, upsertPlatformConfig, findAllPlatformConfigs } from "../repository/platform-config.repository";
import { Decimal } from "@prisma/client/runtime/library";

export const CC_USD_RATE_KEY = "CC_USD_RATE";
export const DEFAULT_CC_USD_RATE = "0.25";

export function validateRateString(rateString: string): string {
  if (!rateString || rateString.trim().length === 0) {
    throw new Error("Rate must be a valid positive number.");
  }

  let dec: Decimal;
  try {
    dec = new Decimal(rateString);
  } catch {
    throw new Error("Rate must be a valid positive number.");
  }

  if (dec.isNaN() || dec.lte(0)) {
    throw new Error("Rate must be strictly greater than zero.");
  }

  return dec.toFixed();
}

export function computeUsdEquivalent(ccAmount: string, rate: string): string {
  try {
    const ccDec = new Decimal(ccAmount || "0");
    const rateDec = new Decimal(rate || DEFAULT_CC_USD_RATE);
    return ccDec.times(rateDec).toFixed(2);
  } catch {
    return "0.00";
  }
}

export async function getCcUsdRate(): Promise<{ rate: string; updatedAt: string }> {
  const config = await findPlatformConfigByKey(CC_USD_RATE_KEY);
  if (!config) {
    return {
      rate: DEFAULT_CC_USD_RATE,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    rate: config.value,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function setCcUsdRate(
  rateString: string,
  actorUserId?: string,
  ipAddress?: string
) {
  const validatedRate = validateRateString(rateString);
  const beforeConfig = await findPlatformConfigByKey(CC_USD_RATE_KEY);

  const updated = await upsertPlatformConfig(
    CC_USD_RATE_KEY,
    validatedRate,
    actorUserId,
    "Authoritative internal CC to USD equivalence valuation rate"
  );

  // Write immutable AuditLog
  await prisma.auditLog.create({
    data: {
      actorUserId: actorUserId || null,
      action: "UPDATE_PLATFORM_CONFIG",
      entityType: "PLATFORM_CONFIG",
      entityId: CC_USD_RATE_KEY,
      beforeState: {
        key: CC_USD_RATE_KEY,
        value: beforeConfig?.value || null,
      },
      afterState: {
        key: CC_USD_RATE_KEY,
        value: validatedRate,
      },
      ipAddress: ipAddress || null,
    },
  });

  return updated;
}

export async function getAllConfigs() {
  return findAllPlatformConfigs();
}
