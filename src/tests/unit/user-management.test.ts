import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserManagementService, UserNotFoundError } from "@/modules/admin/service/user-management.service";

describe("UserManagementService (Unit)", () => {
  let mockRepository: any;
  let mockPrisma: any;
  let service: UserManagementService;

  beforeEach(() => {
    mockRepository = {
      findUserById: vi.fn(),
      updateKycRequired: vi.fn(),
      findAllUsers: vi.fn(),
      countUsers: vi.fn(),
    };
    mockPrisma = {
      auditLog: {
        create: vi.fn(),
      },
    };
    service = new UserManagementService(mockRepository, mockPrisma);
  });

  it("toggleUserKyc throws UserNotFoundError if user does not exist", async () => {
    mockRepository.findUserById.mockResolvedValue(null);

    await expect(
      service.toggleUserKyc("non-existent-user", false, "admin-1")
    ).rejects.toThrow(UserNotFoundError);

    expect(mockRepository.updateKycRequired).not.toHaveBeenCalled();
    expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("toggleUserKyc updates kycRequired and creates AuditLog entry with correct beforeState/afterState", async () => {
    const existingUser = {
      id: "user-123",
      email: "user@coincaret.com",
      displayName: "Demo User",
      kycRequired: true,
    };

    mockRepository.findUserById.mockResolvedValue(existingUser);
    mockRepository.updateKycRequired.mockResolvedValue({
      ...existingUser,
      kycRequired: false,
    });
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit-1" });

    const result = await service.toggleUserKyc("user-123", false, "admin-1", "127.0.0.1");

    expect(mockRepository.updateKycRequired).toHaveBeenCalledWith("user-123", false);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: "KYC_USER_OVERRIDE",
        entityType: "User",
        entityId: "user-123",
        beforeState: { kycRequired: true },
        afterState: { kycRequired: false },
        ipAddress: "127.0.0.1",
      },
    });
    expect(result).toEqual({
      userId: "user-123",
      kycRequired: false,
    });
  });
});
