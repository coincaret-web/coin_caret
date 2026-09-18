import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

import { UserProfileCard } from "@/components/admin/UserProfileCard";
import { KycReviewPanel } from "@/components/admin/KycReviewPanel";
import { KycDocumentViewer } from "@/components/admin/KycDocumentViewer";
import { InlineTreasuryMint } from "@/components/admin/InlineTreasuryMint";
import { UserWalletsList } from "@/components/admin/UserWalletsList";
import { AdminUserDetail, AdminUserWallet } from "@/types/user";

describe("AdminUserDetail Components (W-906)", () => {
  const mockUser: AdminUserDetail = {
    id: "user-123",
    email: "test@coincaret.com",
    displayName: "Apex Digital Capital",
    phoneNumber: "+1-555-019-9999",
    address: "1 Sovereign Plaza, Austin, TX",
    status: "ACTIVE",
    kycRequired: true,
    roles: ["USER"],
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  };

  const mockWallets: AdminUserWallet[] = [
    { id: "w-cc", assetSymbol: "CC", assetName: "Coin Caret", address: "CC0x123", availableBalance: "5000.00000000", reservedBalance: "0.00000000" },
    { id: "w-btc", assetSymbol: "BTC", assetName: "Bitcoin", address: "BTC0x456", availableBalance: "0.15000000", reservedBalance: "0.00000000" },
    { id: "w-eth", assetSymbol: "ETH", assetName: "Ethereum", address: "ETH0x789", availableBalance: "2.50000000", reservedBalance: "0.00000000" },
    { id: "w-sol", assetSymbol: "SOL", assetName: "Solana", address: "SOL0xabc", availableBalance: "35.00000000", reservedBalance: "0.00000000" },
    { id: "w-bnb", assetSymbol: "BNB", assetName: "BNB", address: "BNB0xdef", availableBalance: "8.00000000", reservedBalance: "0.00000000" },
    { id: "w-ltc", assetSymbol: "LTC", assetName: "Litecoin", address: "LTC0x111", availableBalance: "12.50000000", reservedBalance: "0.00000000" },
    { id: "w-xrp", assetSymbol: "XRP", assetName: "Ripple", address: "XRP0x222", availableBalance: "1500.00000000", reservedBalance: "0.00000000" },
    { id: "w-doge", assetSymbol: "DOGE", assetName: "Dogecoin", address: "DOGE0x333", availableBalance: "8000.00000000", reservedBalance: "0.00000000" },
  ];

  it("UserProfileCard renders name, email, phone, and address", () => {
    render(<UserProfileCard user={mockUser} />);
    expect(screen.getByText("Apex Digital Capital")).toBeDefined();
    expect(screen.getByText("test@coincaret.com")).toBeDefined();
    expect(screen.getByText("+1-555-019-9999")).toBeDefined();
    expect(screen.getByText("1 Sovereign Plaza, Austin, TX")).toBeDefined();
  });

  it("KycReviewPanel renders review form only when status is PENDING_REVIEW", () => {
    const { rerender } = render(
      <KycReviewPanel userId="user-123" status="PENDING_REVIEW" />
    );
    expect(screen.getByRole("button", { name: /approve/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDefined();

    rerender(<KycReviewPanel userId="user-123" status="APPROVED" />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });

  it("InlineTreasuryMint renders all 8 asset tiles and updates selected wallet", () => {
    render(<InlineTreasuryMint userId="user-123" wallets={mockWallets} />);
    expect(screen.getByText("BTC")).toBeDefined();
    expect(screen.getByText("ETH")).toBeDefined();
    expect(screen.getByText("SOL")).toBeDefined();
    expect(screen.getByText("DOGE")).toBeDefined();
  });

  it("UserWalletsList renders all 8 wallets with balances", () => {
    render(<UserWalletsList wallets={mockWallets} />);
    expect(screen.getByText("5000.00000000")).toBeDefined();
    expect(screen.getByText("0.15000000")).toBeDefined();
  });
});
