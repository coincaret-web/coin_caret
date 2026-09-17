import { describe, it, expect } from "vitest";
import { calculateSwapQuote, validateSwapInput } from "@/modules/network/service/swap.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Internal Swap Engine (W-802 Unit)", () => {
  it("should calculate exact swap quote with fee deduction and Decimal math", () => {
    // 100 CC to BTC at rate 0.00000385 with fee 0.50 CC
    const quote = calculateSwapQuote({
      fromAmount: new Decimal("100.00000000"),
      rate: new Decimal("0.00000385"),
      fee: new Decimal("0.50000000"),
    });

    // gross toAmount = 100 * 0.00000385 = 0.00038500 BTC
    expect(quote.toAmount.toFixed(8)).toBe("0.00038500");
    expect(quote.fee.toFixed(8)).toBe("0.50000000");
    expect(quote.totalDebit.toFixed(8)).toBe("100.50000000");
  });

  it("should validate swap inputs and reject invalid parameters", () => {
    expect(() =>
      validateSwapInput({
        fromSymbol: "BTC",
        toSymbol: "BTC",
        amount: "1.0",
        availableBalance: "10.0",
        fee: "0.0001",
      })
    ).toThrow(/cannot swap between identical assets/i);

    expect(() =>
      validateSwapInput({
        fromSymbol: "ETH",
        toSymbol: "SOL",
        amount: "-2.0",
        availableBalance: "10.0",
        fee: "0.005",
      })
    ).toThrow(/strictly greater than zero/i);

    expect(() =>
      validateSwapInput({
        fromSymbol: "ETH",
        toSymbol: "SOL",
        amount: "10.0",
        availableBalance: "10.0",
        fee: "0.005",
      })
    ).toThrow(/insufficient funds/i);
  });
});
