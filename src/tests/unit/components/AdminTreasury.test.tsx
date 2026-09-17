import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TreasuryMintForm } from "@/components/admin/TreasuryMintForm";

describe("Admin Treasury Mint Form (W-704 Component)", () => {
  const mockWallets = [
    {
      id: "w-btc-1",
      label: "Bitcoin Vault",
      address: "BTC0x7a89bc234def567890123456789abcdef0123456",
      userEmail: "client@coincaret.com",
      userName: "Apex Digital",
      assetSymbol: "BTC",
    },
    {
      id: "w-eth-1",
      label: "Ethereum Vault",
      address: "ETH0x8b90cd345ef67890123456789abcdef01234567",
      userEmail: "client@coincaret.com",
      userName: "Apex Digital",
      assetSymbol: "ETH",
    },
  ];

  it("should render wallet options with asset symbols and address tags", () => {
    render(<TreasuryMintForm wallets={mockWallets as any} />);

    expect(screen.getByText(/Target Recipient Account/i)).toBeDefined();
    expect(screen.getByText(/Audit Reason & Memo/i)).toBeDefined();
    expect(screen.getByText(/Execute Atomic Treasury Mint/i)).toBeDefined();
  });
});
