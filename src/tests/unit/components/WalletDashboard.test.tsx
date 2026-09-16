import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BalanceOverviewCard } from "@/components/wallet/BalanceOverviewCard";
import { RecentActivityTable } from "@/components/wallet/RecentActivityTable";
import { PortfolioChart } from "@/components/wallet/PortfolioChart";

describe("Wallet Dashboard & Balance Derivations (W-401)", () => {
  it("renders Total Balance, Available, and Reserved Pending cards accurately", () => {
    render(
      <BalanceOverviewCard
        availableBalance="5,000.00000000"
        reservedBalance="50.00000000"
        totalBalance="5,050.00000000"
        assetSymbol="CC"
      />
    );

    // Assert total portfolio value
    expect(screen.getByText("Total Balance")).toBeDefined();
    expect(screen.getByText("5,050.00000000")).toBeDefined();

    // Assert Available Funds card
    expect(screen.getByText("Available for Transfer")).toBeDefined();
    expect(screen.getByText(/5,000\.00000000/)).toBeDefined();

    // Assert Reserved Pending Funds card
    expect(screen.getByText("Reserved in Mempool")).toBeDefined();
    const reservedMatches = screen.getAllByText(/50\.00000000/);
    expect(reservedMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the RecentActivityTable with status badges and transaction hashes", () => {
    const mockTransactions = [
      {
        id: "tx-1",
        txHash: "0x4f8a92b3c7e1d5a890123456789abcdef0123456789abcdef0123456789abcde",
        type: "TRANSFER",
        fromAddress: "CC0x1111111111111111111111111111111111111111",
        toAddress: "CC0x2222222222222222222222222222222222222222",
        amount: "100.00000000",
        fee: "0.00050000",
        status: "CONFIRMED",
        confirmations: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tx-2",
        txHash: "0x99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff",
        type: "TRANSFER",
        fromAddress: "CC0x1111111111111111111111111111111111111111",
        toAddress: "CC0x3333333333333333333333333333333333333333",
        amount: "25.50000000",
        fee: "0.00050000",
        status: "IN_MEMPOOL",
        confirmations: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    render(<RecentActivityTable transactions={mockTransactions} onSelectTx={() => {}} />);

    expect(screen.getByText("Recent Ledger Activity")).toBeDefined();
    expect(screen.getByText("100.00000000 CC")).toBeDefined();
    expect(screen.getByText("25.50000000 CC")).toBeDefined();
    expect(screen.getByText("Confirmed (3/3)")).toBeDefined();
    expect(screen.getByText("Mempool (1/3)")).toBeDefined();
  });

  it("renders PortfolioChart with authentic ledger delta calculations", () => {
    const userAddress = "CC0xUserWallet11111111111111111111111111";
    const transactions = [
      {
        id: "tx-1",
        amount: "200.00000000",
        fee: "0.00050000",
        toAddress: userAddress,
        fromAddress: "CC0xTreasury22222222222222222222222222",
        createdAt: "2026-09-16T22:17:01.000Z",
        status: "CONFIRMED",
      },
      {
        id: "tx-2",
        amount: "500.00000000",
        fee: "0.00050000",
        toAddress: userAddress,
        fromAddress: "CC0xTreasury22222222222222222222222222",
        createdAt: "2026-09-16T22:26:21.000Z",
        status: "CONFIRMED",
      },
    ];

    render(
      <PortfolioChart
        currentBalance="705.00000000"
        primaryAddress={userAddress}
        transactions={transactions}
      />
    );

    expect(screen.getByText(/24H Portfolio Performance/i)).toBeDefined();
    expect(screen.getByText(/Real-time ledger asset valuation/i)).toBeDefined();
    // Starting balance = 705 - 500 - 200 = 5 CC. Delta = ((705 - 5) / 5) * 100 = +14000.00%
    expect(screen.getByText(/\+14000\.00% \(24h\)/)).toBeDefined();
  });
});
