import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { KycStatusBadge } from "@/components/admin/KycStatusBadge";
import { AdminUserListItem } from "@/types/user";

describe("AdminUsersList Components (W-905)", () => {
  const mockUsers: AdminUserListItem[] = [
    {
      id: "user-1",
      email: "alice@coincaret.com",
      displayName: "Alice Satoshi",
      phoneNumber: "+1-555-019-3333",
      status: "ACTIVE",
      kycRequired: true,
      kycStatus: "APPROVED",
      roles: ["USER"],
      createdAt: new Date("2026-01-15T12:00:00Z"),
    },
    {
      id: "user-2",
      email: "bob@coincaret.com",
      displayName: "Bob Nakamoto",
      phoneNumber: "+1-555-019-4444",
      status: "ACTIVE",
      kycRequired: true,
      kycStatus: "PENDING_REVIEW",
      roles: ["USER"],
      createdAt: new Date("2026-02-20T12:00:00Z"),
    },
    {
      id: "user-3",
      email: "vip@coincaret.com",
      displayName: "VIP Client",
      phoneNumber: "+1-555-019-5555",
      status: "ACTIVE",
      kycRequired: false,
      kycStatus: "NOT_SUBMITTED",
      roles: ["USER"],
      createdAt: new Date("2026-03-01T12:00:00Z"),
    },
  ];

  it("AdminUsersTable renders correct table rows for users", () => {
    render(<AdminUsersTable users={mockUsers} />);

    expect(screen.getByText("Alice Satoshi")).toBeDefined();
    expect(screen.getByText("alice@coincaret.com")).toBeDefined();
    expect(screen.getByText("Bob Nakamoto")).toBeDefined();
    expect(screen.getByText("VIP Client")).toBeDefined();
    expect(screen.getAllByRole("link", { name: /view/i }).length).toBe(3);
  });

  it("KycStatusBadge renders correct labels and visual indicators", () => {
    const { rerender } = render(<KycStatusBadge status="APPROVED" kycRequired={true} />);
    expect(screen.getByText(/Verified|Approved/i)).toBeDefined();

    rerender(<KycStatusBadge status="PENDING_REVIEW" kycRequired={true} />);
    expect(screen.getByText(/Pending|Under Review/i)).toBeDefined();

    rerender(<KycStatusBadge status="REJECTED" kycRequired={true} />);
    expect(screen.getByText(/Rejected/i)).toBeDefined();

    rerender(<KycStatusBadge status="NOT_SUBMITTED" kycRequired={true} />);
    expect(screen.getByText(/Not Submitted|Unverified/i)).toBeDefined();

    rerender(<KycStatusBadge status="NOT_SUBMITTED" kycRequired={false} />);
    expect(screen.getByText(/Exempt|KYC Off/i)).toBeDefined();
  });
});
