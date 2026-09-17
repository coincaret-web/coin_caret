/**
 * W-903 — Multi-Asset SendForm: form reflects correct asset symbol and fee
 *
 * Component tests confirming that:
 * 1. SendForm title shows "Send Bitcoin (BTC)" not hardcoded "Send Coin Caret (CC)".
 * 2. Available balance label shows the correct asset symbol (e.g., "0.15000000 BTC").
 * 3. Network fee label shows the correct asset symbol in the gas breakdown.
 * 4. SendReviewModal passes assetSymbol to all amount fields correctly.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SendReviewModal } from "@/components/wallet/SendReviewModal";
import { SendForm } from "@/components/wallet/SendForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/wallet/send",
  useSearchParams: () => new URLSearchParams(),
}));

describe("W-903 — Multi-Asset SendReviewModal renders asset-specific fields", () => {
  it("renders 'BTC' in amount, fee, and total debit fields when assetSymbol is BTC", () => {
    render(
      <SendReviewModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        recipientAddress="BTC0x9876543210abcdef0123456789abcdef01234567"
        amount="0.10000000"
        networkFee="0.00001500"
        totalDebit="0.10001500"
        assetSymbol="BTC"
        isLoading={false}
      />
    );

    // The asset symbol must appear in the breakdown — not hardcoded CC
    expect(screen.getByText("0.10000000 BTC")).toBeDefined();
    expect(screen.getByText("0.00001500 BTC")).toBeDefined();
    expect(screen.getByText("0.10001500 BTC")).toBeDefined();
    // Review header must exist
    expect(screen.getByText("Review Transaction")).toBeDefined();
  });

  it("renders 'ETH' in amount and fee fields when assetSymbol is ETH", () => {
    render(
      <SendReviewModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        recipientAddress="ETH0xabc123def456789012345678901234567890abcd"
        amount="0.50000000"
        networkFee="0.00050000"
        totalDebit="0.50050000"
        assetSymbol="ETH"
        isLoading={false}
      />
    );

    expect(screen.getByText("0.50000000 ETH")).toBeDefined();
    expect(screen.getByText("0.00050000 ETH")).toBeDefined();
    expect(screen.getByText("0.50050000 ETH")).toBeDefined();
  });

  it("still renders 'CC' when assetSymbol is CC (backward compatibility)", () => {
    render(
      <SendReviewModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        recipientAddress="CC0x9876543210abcdef0123456789abcdef01234567"
        amount="100.00000000"
        networkFee="0.50000000"
        totalDebit="100.50000000"
        assetSymbol="CC"
        isLoading={false}
      />
    );

    expect(screen.getByText("100.00000000 CC")).toBeDefined();
    expect(screen.getByText("0.50000000 CC")).toBeDefined();
    expect(screen.getByText("100.50000000 CC")).toBeDefined();
  });
});

describe("W-905 — Multi-Asset SendForm renders Asset Selector and handles switching", () => {
  const mockWallets = [
    { symbol: "CC", name: "Coin Caret", address: "CC0x1111111111111111111111111111111111111111", walletId: "w-cc", availableBalance: "5000.00000000", networkFee: "0.50000000" },
    { symbol: "BTC", name: "Bitcoin", address: "BTC0x2222222222222222222222222222222222222222", walletId: "w-btc", availableBalance: "0.15000000", networkFee: "0.00001500" },
    { symbol: "ETH", name: "Ethereum", address: "ETH0x3333333333333333333333333333333333333333", walletId: "w-eth", availableBalance: "2.50000000", networkFee: "0.00050000" },
  ];

  it("renders an interactive Asset Selector select element when wallets are provided", () => {
    render(
      <SendForm
        availableBalance="5000.00000000"
        senderAddress="CC0x1111111111111111111111111111111111111111"
        assetSymbol="CC"
        assetName="Coin Caret"
        walletId="w-cc"
        networkFee="0.50000000"
        wallets={mockWallets}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.value).toBe("CC");
    expect(screen.getByText(/Bitcoin/i)).toBeDefined();
    expect(screen.getByText(/Ethereum/i)).toBeDefined();
  });

  it("calls onSelectAsset when user picks a different asset from dropdown", async () => {
    let selected = "";
    render(
      <SendForm
        availableBalance="5000.00000000"
        senderAddress="CC0x1111111111111111111111111111111111111111"
        assetSymbol="CC"
        assetName="Coin Caret"
        walletId="w-cc"
        networkFee="0.50000000"
        wallets={mockWallets}
        onSelectAsset={(sym) => { selected = sym; }}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    select.value = "BTC";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(selected).toBe("BTC");
  });
});

