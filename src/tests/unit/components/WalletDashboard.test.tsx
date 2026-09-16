import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BalanceOverviewCard } from "@/components/wallet/BalanceOverviewCard";
import { RecentActivityTable } from "@/components/wallet/RecentActivityTable";

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
});
