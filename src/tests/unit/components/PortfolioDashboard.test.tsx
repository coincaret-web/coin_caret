import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortfolioDashboard } from "@/components/wallet/PortfolioDashboard";

// Mock next-auth and next/navigation
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { email: "trader@coincaret.com" } } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/wallet",
}));

describe("PortfolioDashboard Component (W-803 Unit)", () => {
  const mockAssets = [
    {
      symbol: "CC",
      name: "Coin Caret Native",
      totalBalance: "10000.00000000",
      availableBalance: "10000.00000000",
      reservedBalance: "0.00000000",
      usdPrice: "0.25",
      usdValue: "2500.00",
      allocationPercentage: "25.00",
      address: "CC0x7F2a89C1e92DbA440F61E1b380295E8d58c1E4D9",
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      totalBalance: "0.10000000",
      availableBalance: "0.10000000",
      reservedBalance: "0.00000000",
      usdPrice: "65000.00",
      usdValue: "6500.00",
      allocationPercentage: "65.00",
      address: "BTC0x7F2a89C1e92DbA440F61E1b380295E8d58c1E4D9",
    },
  ];

  it("renders total portfolio net worth and individual asset cards", () => {
    render(
      <PortfolioDashboard
        assets={mockAssets}
        totalPortfolioUsdValue="9000.00"
      />
    );

    expect(screen.getByText("$9,000.00")).toBeDefined();
    expect(screen.getByText("Multi-Currency Institutional Portfolio")).toBeDefined();
    expect(screen.getAllByText("CC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BTC").length).toBeGreaterThan(0);
  });
});
