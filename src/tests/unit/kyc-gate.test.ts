import { describe, it, expect, vi, beforeEach } from "vitest";
import { KycGateService } from "@/modules/kyc/service/kyc-gate.service";

describe("KycGateService (Unit)", () => {
  let mockPrisma: any;
  let kycGateService: KycGateService;

  beforeEach(() => {
    mockPrisma = {
      platformConfig: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      userVerification: {
        findUnique: vi.fn(),
      },
    };
    kycGateService = new KycGateService(mockPrisma);
  });

  it("returns FULL_ACCESS when platform KYC_REQUIRED is false without querying user verification", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "false",
    });

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("FULL_ACCESS");
    expect(mockPrisma.userVerification.findUnique).not.toHaveBeenCalled();
  });

  it("returns FULL_ACCESS when user.kycRequired is false even if platform KYC_REQUIRED is true", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "true",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      kycRequired: false,
    });

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("FULL_ACCESS");
    expect(mockPrisma.userVerification.findUnique).not.toHaveBeenCalled();
  });

  it("returns NEEDS_UPLOAD when user has no verification row", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "true",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      kycRequired: true,
    });
    mockPrisma.userVerification.findUnique.mockResolvedValue(null);

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("NEEDS_UPLOAD");
  });

  it("returns AWAITING_REVIEW when user verification is PENDING_REVIEW", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "true",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      kycRequired: true,
    });
    mockPrisma.userVerification.findUnique.mockResolvedValue({
      id: "ver-1",
      userId: "user-123",
      status: "PENDING_REVIEW",
    });

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("AWAITING_REVIEW");
  });

  it("returns FULL_ACCESS when user verification is APPROVED", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "true",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      kycRequired: true,
    });
    mockPrisma.userVerification.findUnique.mockResolvedValue({
      id: "ver-1",
      userId: "user-123",
      status: "APPROVED",
    });

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("FULL_ACCESS");
  });

  it("returns REJECTED_REUPLOAD when user verification is REJECTED", async () => {
    mockPrisma.platformConfig.findUnique.mockResolvedValue({
      key: "KYC_REQUIRED",
      value: "true",
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-123",
      kycRequired: true,
    });
    mockPrisma.userVerification.findUnique.mockResolvedValue({
      id: "ver-1",
      userId: "user-123",
      status: "REJECTED",
    });

    const status = await kycGateService.getAccessStatus("user-123");

    expect(status).toBe("REJECTED_REUPLOAD");
  });
});
