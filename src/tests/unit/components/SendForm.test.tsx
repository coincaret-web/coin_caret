import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SendReviewModal } from "@/components/wallet/SendReviewModal";

describe("Send CC Workflow & Review Modal (W-403)", () => {
  it("renders review modal with accurate recipient, network gas fee, and total debit breakdown", () => {
    const recipient = "CC0x9876543210abcdef0123456789abcdef01234567";
    const amount = "100.00000000";
    const networkFee = "0.00050000";
    const totalDebit = "100.00050000";

    render(
      <SendReviewModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        recipientAddress={recipient}
        amount={amount}
        networkFee={networkFee}
        totalDebit={totalDebit}
        isLoading={false}
      />
    );

    expect(screen.getByText("Review Transaction")).toBeDefined();
    expect(screen.getByText(recipient)).toBeDefined();
    expect(screen.getByText("100.00000000 CC")).toBeDefined();
    expect(screen.getByText("0.00050000 CC")).toBeDefined();
    expect(screen.getByText("100.00050000 CC")).toBeDefined();
    expect(screen.getByRole("button", { name: /Confirm & Broadcast Transaction/i })).toBeDefined();
  });
});
