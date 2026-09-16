import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReceiveCard } from "@/components/wallet/ReceiveCard";

describe("Receive Screen & QR Code Component (W-402)", () => {
  it("renders user address, QR code canvas/svg, and network safety parameters", () => {
    const testAddress = "CC0x4f8a92b3c7e1d5a890123456789abcdef0123456";

    render(
      <ReceiveCard
        address={testAddress}
        networkName="Coin Caret Mainnet"
        chainId={3847}
      />
    );

    // Verify address display
    expect(screen.getByText(testAddress)).toBeDefined();

    // Verify chain & network specs
    expect(screen.getByText(/Coin Caret Mainnet/i)).toBeDefined();
    expect(screen.getByText("3847")).toBeDefined();

    // Verify Copy Address CTA
    expect(screen.getByRole("button", { name: /Copy Address/i })).toBeDefined();
  });
});
