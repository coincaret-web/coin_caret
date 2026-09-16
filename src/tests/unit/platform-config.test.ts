import { describe, it, expect } from "vitest";
import { validateRateString, computeUsdEquivalent } from "@/modules/admin/service/platform-config.service";

describe("PlatformConfig Service & Currency Math (W-603 Unit)", () => {
  it("throws for invalid rate strings (0, negative, non-numeric)", () => {
    expect(() => validateRateString("0.00")).toThrow(/strictly greater than zero/i);
    expect(() => validateRateString("-5")).toThrow(/strictly greater than zero/i);
    expect(() => validateRateString("abc")).toThrow(/valid positive number/i);
    expect(() => validateRateString("")).toThrow(/valid positive number/i);
  });

  it("validates positive rate string and minimum micro-cent fraction (0.00000001)", () => {
    expect(validateRateString("1.25")).toBe("1.25");
    expect(validateRateString("0.25")).toBe("0.25");
    expect(validateRateString("0.00000001")).toBe("0.00000001");
  });

  it("computes USD equivalent using exact Decimal math", () => {
    const usd1 = computeUsdEquivalent("5000.00000000", "0.25");
    expect(usd1).toBe("1250.00");

    const usd2 = computeUsdEquivalent("1000.00000000", "0.50");
    expect(usd2).toBe("500.00");

    const zeroUsd = computeUsdEquivalent("0.00000000", "0.25");
    expect(zeroUsd).toBe("0.00");
  });
});
