import { describe, it, expect } from "vitest";
import { computePortfolioMetrics } from "@/modules/wallets/service/portfolio.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Multi-Currency Portfolio Calculation Math (W-803 Unit)", () => {
  it("should calculate exact aggregate portfolio USD value and individual asset percentage weights", () => {
    const assets = [
      {
        symbol: "CC",
        totalBalance: "10000.00000000",
        usdPrice: "0.25", // $2,500.00 USD
      },
      {
        symbol: "BTC",
        totalBalance: "0.10000000",
        usdPrice: "65000.00", // $6,500.00 USD
      },
      {
        symbol: "ETH",
        totalBalance: "1.00000000",
        usdPrice: "3400.00", // $3,400.00 USD
      },
    ];

    // Total Portfolio USD = 2500 + 6500 + 3400 = $12,400.00
    const metrics = computePortfolioMetrics(assets);

    expect(metrics.totalPortfolioUsdValue).toBe("12400.00");
    expect(metrics.assets).toHaveLength(3);

    const ccMetric = metrics.assets.find((a) => a.symbol === "CC");
    expect(ccMetric?.usdValue).toBe("2500.00");
    // (2500 / 12400) * 100 = 20.16129... -> 20.16%
    expect(ccMetric?.allocationPercentage).toBe("20.16");

    const btcMetric = metrics.assets.find((a) => a.symbol === "BTC");
    expect(btcMetric?.usdValue).toBe("6500.00");
    // (6500 / 12400) * 100 = 52.41935... -> 52.42%
    expect(btcMetric?.allocationPercentage).toBe("52.42");
  });

  it("should handle zero total balance gracefully without division by zero errors", () => {
    const assets = [
      { symbol: "CC", totalBalance: "0.00000000", usdPrice: "0.25" },
      { symbol: "BTC", totalBalance: "0.00000000", usdPrice: "65000.00" },
    ];

    const metrics = computePortfolioMetrics(assets);
    expect(metrics.totalPortfolioUsdValue).toBe("0.00");
    expect(metrics.assets[0].allocationPercentage).toBe("0.00");
  });
});
