/**
 * W-902 — Multi-Asset Receive: ReceiveCard renders correct asset metadata
 *
 * Component tests confirming that:
 * 1. ReceiveCard shows the correct asset symbol and name (not hardcoded "CC").
 * 2. ReceiveCard renders the correct asset-specific address.
 * 3. ReceiveCard title reflects the chosen asset (e.g., "Receive Bitcoin (BTC)").
 * 4. The deposit address label reflects the asset prefix (e.g., "Your BTC0x Deposit Address").
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReceiveCard } from "@/components/wallet/ReceiveCard";

describe("W-902 — Multi-Asset ReceiveCard renders asset-specific metadata", () => {
  it("shows 'Receive Bitcoin (BTC)' title and BTC0x address label for BTC asset", () => {
    const btcAddress = "BTC0x4f8a92b3c7e1d5a890123456789abcdef0123456";

    render(
      <ReceiveCard
        address={btcAddress}
        assetSymbol="BTC"
        assetName="Bitcoin"
        networkName="Coin Caret Mainnet"
        chainId={3847}
      />
    );

    // Title must reflect the specific asset — not hardcoded CC
    expect(screen.getByText(/Receive Bitcoin \(BTC\)/i)).toBeDefined();

    // Deposit address label must reflect asset prefix
    expect(screen.getByText(/BTC0x Deposit Address/i)).toBeDefined();

    // The actual address must be rendered
    expect(screen.getByText(btcAddress)).toBeDefined();
  });

  it("shows 'Receive Ethereum (ETH)' and ETH0x label for ETH asset", () => {
    const ethAddress = "ETH0xabc123def456789012345678901234567890abcd";

    render(
      <ReceiveCard
        address={ethAddress}
        assetSymbol="ETH"
        assetName="Ethereum"
        networkName="Coin Caret Mainnet"
        chainId={3847}
      />
    );

    expect(screen.getByText(/Receive Ethereum \(ETH\)/i)).toBeDefined();
    expect(screen.getByText(/ETH0x Deposit Address/i)).toBeDefined();
    expect(screen.getByText(ethAddress)).toBeDefined();
  });

  it("defaults to 'Receive Coin Caret (CC)' and CC0x label when assetSymbol is CC", () => {
    const ccAddress = "CC0x4f8a92b3c7e1d5a890123456789abcdef0123456";

    render(
      <ReceiveCard
        address={ccAddress}
        assetSymbol="CC"
        assetName="Coin Caret"
        networkName="Coin Caret Mainnet"
        chainId={3847}
      />
    );

    expect(screen.getByText(/Receive Coin Caret \(CC\)/i)).toBeDefined();
    expect(screen.getByText(/CC0x Deposit Address/i)).toBeDefined();
  });

  it("still shows Copy Address button regardless of asset", () => {
    render(
      <ReceiveCard
        address="SOL0x1234567890abcdef1234567890abcdef12345678"
        assetSymbol="SOL"
        assetName="Solana"
        networkName="Coin Caret Mainnet"
        chainId={3847}
      />
    );

    expect(screen.getByRole("button", { name: /Copy Address/i })).toBeDefined();
  });

  it("renders Asset Selector dropdown when wallets list is provided and allows switching", () => {
    let selected = "";
    const mockWallets = [
      { symbol: "CC", name: "Coin Caret", address: "CC0x1111111111111111111111111111111111111111" },
      { symbol: "BTC", name: "Bitcoin", address: "BTC0x2222222222222222222222222222222222222222" },
      { symbol: "ETH", name: "Ethereum", address: "ETH0x3333333333333333333333333333333333333333" },
    ];

    render(
      <ReceiveCard
        address="CC0x1111111111111111111111111111111111111111"
        assetSymbol="CC"
        assetName="Coin Caret"
        networkName="Coin Caret Mainnet"
        chainId={3847}
        wallets={mockWallets}
        onSelectAsset={(sym) => { selected = sym; }}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.value).toBe("CC");

    select.value = "ETH";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(selected).toBe("ETH");
  });
});

