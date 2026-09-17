import { describe, it, expect } from "vitest";
import { computeCrossRate, sanitizePairRateInput } from "@/modules/market/service/exchange-rate.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Cross-Asset Exchange Rate Matrix (W-801 Unit)", () => {
  it("should calculate exact cross-rate using high-precision Decimal math", () => {
    // ETH = $3400.00, SOL = $145.00 -> ETH/SOL = 3400 / 145 = 23.44827586
    const ethPrice = new Decimal("3400.00");
    const solPrice = new Decimal("145.00");

    const computedRate = computeCrossRate(ethPrice, solPrice);
    expect(computedRate.toFixed(8)).toBe("23.44827586");
  });

  it("should calculate CC to BTC cross-rate given CC=$0.25 and BTC=$65,000", () => {
    const ccPrice = new Decimal("0.25");
    const btcPrice = new Decimal("65000.00");

    const rate = computeCrossRate(ccPrice, btcPrice);
    // 0.25 / 65000 = 0.00000384615... -> 0.00000385 (8 decimal places)
    expect(rate.toFixed(8)).toBe("0.00000385");
  });

  it("should sanitize and validate rate inputs strictly", () => {
    expect(() => sanitizePairRateInput("0.00")).toThrow(/strictly greater than zero/i);
    expect(() => sanitizePairRateInput("-1.50")).toThrow(/strictly greater than zero/i);
    expect(() => sanitizePairRateInput("abc")).toThrow(/valid numeric/i);

    const valid = sanitizePairRateInput("0.00000400");
    expect(valid.toFixed(8)).toBe("0.00000400");
  });
});
