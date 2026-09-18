import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

import KycVerifyPage from "@/app/verify/page";

describe("KycVerifyPage Rendering & State Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to /login", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<KycVerifyPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?callbackUrl=/verify");
    });
  });

  it("renders upload form when user has NOT_SUBMITTED status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: "NOT_SUBMITTED",
        reviewNotes: null,
      }),
    });

    render(<KycVerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("Identity & Regulatory Verification")).toBeDefined();
      expect(screen.getByPlaceholderText("XXX-XX-XXXX")).toBeDefined();
      expect(screen.getByText(/1\. Social Security Card/i)).toBeDefined();
      expect(screen.getByText(/2\. Federal Government ID/i)).toBeDefined();
      expect(screen.getByText(/3\. State Driver's License/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Submit Verification Documents/i })).toBeDefined();
    });
  });

  it("renders review status when user submission is PENDING_REVIEW", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: "PENDING_REVIEW",
        reviewNotes: null,
      }),
    });

    render(<KycVerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("Documents Under Compliance Review")).toBeDefined();
      expect(screen.getByText(/Refresh Review Status/i)).toBeDefined();
    });
  });

  it("renders approved banner when status is APPROVED", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: "APPROVED",
        reviewNotes: null,
      }),
    });

    render(<KycVerifyPage />);

    await waitFor(() => {
      expect(screen.getByText("Identity Verified & Approved")).toBeDefined();
      expect(screen.getByText("Proceed to Wallet Dashboard")).toBeDefined();
    });
  });
});
