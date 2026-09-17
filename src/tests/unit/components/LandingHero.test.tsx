import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "@/app/page";
import { LiveNetworkStats } from "@/components/marketing/LiveNetworkStats";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";

describe("Landing Page & Hero Component (W-301)", () => {
  it("renders the main hero heading and luxury brand elements", async () => {
    const page = await HomePage();
    render(page);
    
    // Brand title and acronym
    const brandElements = screen.getAllByText("COIN CARET");
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
    
    // Core value proposition
    expect(screen.getByText(/The Multi-Currency Engine Built for/i)).toBeDefined();
    expect(screen.getByText(/Trading & Settlement Precision/i)).toBeDefined();
    
    // Call to Action links
    expect(screen.getByText(/Open Web Wallet/i)).toBeDefined();
    expect(screen.getAllByText(/Block Explorer/i).length).toBeGreaterThan(0);
  });

  it("renders the live network status indicator badge", async () => {
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/Coin Caret Multi-Asset Mainnet Active/i)).toBeDefined();
    expect(screen.getByText(/8 Currencies Supported/i)).toBeDefined();
  });

  it("renders the LiveNetworkStats component with core blockchain metrics", () => {
    const mockStats = {
      blockHeight: 14280,
      totalTransactions: 98450,
      avgBlockTime: "10.0s",
      circulatingSupply: "12,500,000 CC",
      gasPrice: "0.0005 CC",
      activeValidators: 24,
    };

    render(<LiveNetworkStats initialStats={mockStats} />);
    
    expect(screen.getByText("Block Height")).toBeDefined();
    expect(screen.getByText("14,280")).toBeDefined();
    expect(screen.getByText("Avg Block Time")).toBeDefined();
    expect(screen.getByText("10.0s")).toBeDefined();
    expect(screen.getByText("Circulating Supply")).toBeDefined();
    expect(screen.getByText("12,500,000 CC")).toBeDefined();
  });

  it("renders the FeatureGrid component with double-entry and 3-tier security features", () => {
    render(<FeatureGrid />);
    
    expect(screen.getByText(/Mathematical Double-Entry/i)).toBeDefined();
    expect(screen.getByText(/3-Tier Block Finality/i)).toBeDefined();
    expect(screen.getByText(/10-Second Block Times/i)).toBeDefined();
    expect(screen.getByText(/Sub-Cent Network Fees/i)).toBeDefined();
  });
});
