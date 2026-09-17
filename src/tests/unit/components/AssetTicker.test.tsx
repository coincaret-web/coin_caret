import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetTicker } from "@/components/marketing/AssetTicker";

describe("AssetTicker Component (W-804 Unit)", () => {
  const mockPrices = [
    { symbol: "CC", name: "Coin Caret", usdPrice: "0.25", change24h: "+5.2%" },
    { symbol: "BTC", name: "Bitcoin", usdPrice: "65000.00", change24h: "+2.1%" },
    { symbol: "ETH", name: "Ethereum", usdPrice: "3400.00", change24h: "+1.8%" },
    { symbol: "SOL", name: "Solana", usdPrice: "145.00", change24h: "+4.6%" },
  ];

  it("renders live ticker items with symbols and USD prices", () => {
    render(<AssetTicker items={mockPrices} />);

    expect(screen.getAllByText("CC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$0.25").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BTC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$65,000.00").length).toBeGreaterThan(0);
  });
});
