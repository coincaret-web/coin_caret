import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/wallet",
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { email: "test@coincaret.com" } },
    status: "authenticated",
  }),
  signOut: vi.fn(),
}));

vi.mock("@/modules/kyc/service/kyc-gate.service", () => ({
  kycGateService: {
    getAccessStatus: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wallet: {
      findFirst: vi.fn().mockResolvedValue({
        id: "w-1",
        addresses: [{ address: "CC0x1111111111111111111111111111111111111111" }],
      }),
    },
  },
}));

import WalletLayout from "@/app/(wallet)/layout";
import { getServerSession } from "next-auth";
import { kycGateService } from "@/modules/kyc/service/kyc-gate.service";

describe("WalletLayout Isolation & KYC Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    await expect(WalletLayout({ children: <div>Wallet Content</div> })).rejects.toThrow(
      "NEXT_REDIRECT:/login?callbackUrl=/wallet"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/login?callbackUrl=/wallet");
  });

  it("redirects users with NEEDS_UPLOAD status to /verify without cyclic redirect dependencies", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user-1", email: "newuser@coincaret.com" },
    } as any);
    vi.mocked(kycGateService.getAccessStatus).mockResolvedValueOnce("NEEDS_UPLOAD");

    await expect(WalletLayout({ children: <div>Wallet Content</div> })).rejects.toThrow(
      "NEXT_REDIRECT:/verify"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/verify");
  });

  it("redirects users with REJECTED_REUPLOAD status to /verify?reason=rejected", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user-1", email: "newuser@coincaret.com" },
    } as any);
    vi.mocked(kycGateService.getAccessStatus).mockResolvedValueOnce("REJECTED_REUPLOAD");

    await expect(WalletLayout({ children: <div>Wallet Content</div> })).rejects.toThrow(
      "NEXT_REDIRECT:/verify?reason=rejected"
    );
    expect(mockRedirect).toHaveBeenCalledWith("/verify?reason=rejected");
  });

  it("renders review screen when user status is AWAITING_REVIEW", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user-1", email: "pending@coincaret.com" },
    } as any);
    vi.mocked(kycGateService.getAccessStatus).mockResolvedValueOnce("AWAITING_REVIEW");

    const layout = await WalletLayout({ children: <div>Wallet Content</div> });
    render(layout);

    expect(screen.getByText("Compliance Desk Review")).toBeDefined();
    expect(screen.getByText("View Submission Status")).toBeDefined();
    expect(screen.queryByText("Wallet Content")).toBeNull();
  });

  it("renders full wallet children when user has FULL_ACCESS", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user-1", email: "verified@coincaret.com" },
    } as any);
    vi.mocked(kycGateService.getAccessStatus).mockResolvedValueOnce("FULL_ACCESS");

    const layout = await WalletLayout({ children: <div data-testid="wallet-content">Wallet Content</div> });
    render(layout);

    expect(screen.getByTestId("wallet-content")).toBeDefined();
  });
});
