import { describe, it, expect } from "vitest";
import { getFeeForAsset, DEFAULT_FEES } from "@/modules/network/service/fee-schedule.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Per-Asset Fee Schedule Service (W-703 Unit)", () => {
  it("should have sensible default fees configured for all 8 supported assets", () => {
    expect(DEFAULT_FEES["CC"]).toBe("0.50");
    expect(DEFAULT_FEES["BTC"]).toBe("0.000015");
    expect(DEFAULT_FEES["ETH"]).toBe("0.0005");
    expect(DEFAULT_FEES["SOL"]).toBe("0.0005");
    expect(DEFAULT_FEES["BNB"]).toBe("0.0005");
    expect(DEFAULT_FEES["LTC"]).toBe("0.001");
    expect(DEFAULT_FEES["XRP"]).toBe("0.1");
    expect(DEFAULT_FEES["DOGE"]).toBe("1.0");
  });

  it("should return correct Decimal fee for CC and BTC", async () => {
    const ccFee = await getFeeForAsset("CC");
    expect(ccFee instanceof Decimal).toBe(true);
    expect(ccFee.toFixed(8)).toBe("0.50000000");

    const btcFee = await getFeeForAsset("BTC");
    expect(btcFee instanceof Decimal).toBe(true);
    expect(btcFee.toFixed(8)).toBe("0.00001500");
  });

  it("should fallback gracefully for unknown assets", async () => {
    const fallbackFee = await getFeeForAsset("UNKNOWN_TOKEN");
    expect(fallbackFee instanceof Decimal).toBe(true);
    expect(fallbackFee.gt(0)).toBe(true);
  });

  it("should compute exact Decimal fee additions without float inaccuracies", () => {
    const btcAmount = new Decimal("0.01");
    const btcFee = new Decimal(DEFAULT_FEES["BTC"]);
    const totalDebit = btcAmount.plus(btcFee);

    expect(totalDebit.toFixed(8)).toBe("0.01001500");
  });
});
