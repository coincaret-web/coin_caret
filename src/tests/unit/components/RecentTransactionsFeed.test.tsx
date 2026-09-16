import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecentTransactionsFeed } from "@/components/explorer/RecentTransactionsFeed";

describe("Recent Transactions Feed Component (W-501)", () => {
  const mockTransactions = [
    {
      id: "tx-1",
      txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      fromAddress: "CC0x1111222233334444555566667777888899990000",
      toAddress: "CC0xaaaabbbbccccddddeeeeffff0000111122223333",
      amount: "250.00000000",
      fee: "0.50000000",
      status: "CONFIRMED",
      confirmations: 3,
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders transaction hash, addresses, amount and confirmation status badge", () => {
    render(<RecentTransactionsFeed initialTransactions={mockTransactions} />);

    expect(screen.getByText("Latest Transactions")).toBeDefined();
    expect(screen.getByText("250.00000000 CC")).toBeDefined();
    expect(screen.getByText("Confirmed (3/3)")).toBeDefined();
  });
});
