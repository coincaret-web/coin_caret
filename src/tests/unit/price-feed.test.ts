import { describe, it, expect } from "vitest";
import { computeCryptoConversions } from "@/modules/market/service/price-feed.service";
import { CoinPriceMap } from "@/types/market";

describe("Crypto Conversion Calculator Math (W-604 Unit)", () => {
  const mockPrices: CoinPriceMap = {
    bitcoin: { coinId: "bitcoin", symbol: "BTC", name: "Bitcoin", usdPrice: "60000.00", fetchedAt: new Date().toISOString() },
    ethereum: { coinId: "ethereum", symbol: "ETH", name: "Ethereum", usdPrice: "3000.00", fetchedAt: new Date().toISOString() },
    solana: { coinId: "solana", symbol: "SOL", name: "Solana", usdPrice: "150.00", fetchedAt: new Date().toISOString() },
    binancecoin: { coinId: "binancecoin", symbol: "BNB", name: "BNB", usdPrice: "500.00", fetchedAt: new Date().toISOString() },
    litecoin: { coinId: "litecoin", symbol: "LTC", name: "Litecoin", usdPrice: "80.00", fetchedAt: new Date().toISOString() },
    ripple: { coinId: "ripple", symbol: "XRP", name: "XRP", usdPrice: "0.50", fetchedAt: new Date().toISOString() },
    dogecoin: { coinId: "dogecoin", symbol: "DOGE", name: "Dogecoin", usdPrice: "0.10", fetchedAt: new Date().toISOString() },
  };

  it("calculates exact equivalent cryptocurrency amounts for CC holdings with Decimal precision", () => {
    // 1,000 CC @ $0.25 = $250 USD
    // BTC: 250 / 60,000 = 0.00416667 BTC (8 decimal places)
    // ETH: 250 / 3,000 = 0.08333333 ETH
    // SOL: 250 / 150 = 1.66666667 SOL
    // XRP: 250 / 0.50 = 500.00000000 XRP
    const results = computeCryptoConversions("1000.00000000", "0.25", mockPrices);
    
    const btc = results.find((r) => r.coinId === "bitcoin");
    expect(btc).toBeDefined();
    expect(btc?.equivalentAmount).toBe("0.00416667");

    const eth = results.find((r) => r.coinId === "ethereum");
    expect(eth?.equivalentAmount).toBe("0.08333333");

    const xrp = results.find((r) => r.coinId === "ripple");
    expect(xrp?.equivalentAmount).toBe("500.00000000");
  });

  it("returns zero equivalent amounts when CC balance is zero", () => {
    const results = computeCryptoConversions("0.00000000", "0.25", mockPrices);
    for (const r of results) {
      expect(r.equivalentAmount).toBe("0.00000000");
    }
  });

  it("guards against zero or negative crypto prices without throwing Infinity", () => {
    const corruptedPrices = {
      ...mockPrices,
      bitcoin: { ...mockPrices.bitcoin, usdPrice: "0.00" },
    };

    const results = computeCryptoConversions("1000.00000000", "0.25", corruptedPrices);
    const btc = results.find((r) => r.coinId === "bitcoin");
    expect(btc?.equivalentAmount).toBe("0.00000000");
  });
});
