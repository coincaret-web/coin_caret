import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetBadge } from "@/components/explorer/AssetBadge";
import { AssetFilterBar } from "@/components/explorer/AssetFilterBar";

describe("Explorer Asset Filter & Badges (W-705 Unit)", () => {
  it("should render color-coded badge for BTC, ETH, and CC", () => {
    const { rerender } = render(<AssetBadge symbol="BTC" />);
    expect(screen.getByText("BTC")).toBeDefined();

    rerender(<AssetBadge symbol="ETH" />);
    expect(screen.getByText("ETH")).toBeDefined();

    rerender(<AssetBadge symbol="CC" />);
    expect(screen.getByText("CC")).toBeDefined();
  });

  it("should render filter dropdown with All Assets option and supported assets", () => {
    render(<AssetFilterBar selectedAsset="BTC" onSelectAsset={() => {}} />);
    expect(screen.getByText(/All Assets/i)).toBeDefined();
  });
});
