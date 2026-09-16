import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LiveBlockFeed } from "@/components/explorer/LiveBlockFeed";

describe("Live Block Feed Component (W-501)", () => {
  const mockBlocks = [
    {
      id: "b-1",
      height: "42",
      blockHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
      parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot: "0x9999888877776666555544443333222211110000aaaabbbbccccddddeeeeffff",
      status: "SEALED",
      transactionCount: 5,
      gasUsed: "2.50000000",
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders block height, transaction count, gas used, and status badge", () => {
    render(<LiveBlockFeed initialBlocks={mockBlocks} />);

    expect(screen.getByText("Latest Blocks")).toBeDefined();
    expect(screen.getByText("Block #42")).toBeDefined();
    expect(screen.getByText("5 txns")).toBeDefined();
    expect(screen.getByText("2.50000000 CC")).toBeDefined();
    expect(screen.getByText("SEALED")).toBeDefined();
  });
});
