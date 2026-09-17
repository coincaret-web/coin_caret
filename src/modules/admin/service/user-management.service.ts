import { prisma as defaultPrisma } from "@/lib/prisma";
import {
  UserManagementRepository,
  userManagementRepository as defaultRepository,
} from "../repository/user-management.repository";
import { AdminUserListItem, AdminUserDetail, AdminUserWallet } from "@/types/user";
import { deriveAccountBalance } from "@/modules/ledger/service/ledger-math";

export class UserNotFoundError extends Error {
  constructor(message = "User not found.") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserManagementService {
  constructor(
    private repository: UserManagementRepository = defaultRepository,
    private prisma: any = defaultPrisma
  ) {}

  async toggleUserKyc(
    userId: string,
    kycRequired: boolean,
    actorUserId?: string,
    ipAddress?: string
  ) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with ID ${userId} was not found.`);
    }

    const beforeKycRequired = user.kycRequired;

    const updatedUser = await this.repository.updateKycRequired(userId, kycRequired);

    // Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action: "KYC_USER_OVERRIDE",
        entityType: "User",
        entityId: userId,
        beforeState: { kycRequired: beforeKycRequired },
        afterState: { kycRequired },
        ipAddress: ipAddress || null,
      },
    });

    return {
      userId: updatedUser.id,
      kycRequired: updatedUser.kycRequired,
    };
  }

  async getAllUsersWithKycStatus(params: {
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{
    users: AdminUserListItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = params.skip ?? 0;
    const take = params.take ?? 20;

    const [rawUsers, total] = await Promise.all([
      this.repository.findAllUsers({ search: params.search, skip, take }),
      this.repository.countUsers(params.search),
    ]);

    const users: AdminUserListItem[] = rawUsers.map((user: any) => {
      const roles = user.roles?.map((r: any) => r.role?.name || "USER") || [];
      const kycStatus = user.verification?.status || "NOT_SUBMITTED";

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        phoneNumber: user.profile?.phoneNumber || null,
        status: user.status,
        kycRequired: user.kycRequired,
        kycStatus,
        roles,
        createdAt: user.createdAt,
      };
    });

    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take) || 1;

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  async getUserWithVerification(userId: string): Promise<AdminUserDetail | null> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      return null;
    }

    const roles = user.roles?.map((r: any) => r.role?.name || "USER") || [];

    // Map wallets with calculated balances
    const wallets: AdminUserWallet[] = await Promise.all(
      (user.wallets || []).map(async (w: any) => {
        const address = w.addresses?.[0]?.address || "";
        const availableAccount = w.ledgerAccounts?.find(
          (acc: any) => acc.accountType === "AVAILABLE"
        );
        const reservedAccount = w.ledgerAccounts?.find(
          (acc: any) => acc.accountType === "RESERVED_PENDING"
        );

        let availableBalance = "0.00000000";
        let reservedBalance = "0.00000000";

        if (availableAccount) {
          const entries = await this.prisma.ledgerEntry.findMany({
            where: { accountId: availableAccount.id },
          });
          availableBalance = deriveAccountBalance(entries).toFixed(8);
        }

        if (reservedAccount) {
          const entries = await this.prisma.ledgerEntry.findMany({
            where: { accountId: reservedAccount.id },
          });
          reservedBalance = deriveAccountBalance(entries).toFixed(8);
        }

        return {
          id: w.id,
          assetSymbol: w.asset?.symbol || "CC",
          assetName: w.asset?.name || "Coin Caret",
          address,
          availableBalance,
          reservedBalance,
        };
      })
    );

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.profile?.phoneNumber || null,
      address: user.profile?.address || null,
      status: user.status,
      kycRequired: user.kycRequired,
      roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      verification: user.verification
        ? {
            id: user.verification.id,
            userId: user.verification.userId,
            status: user.verification.status,
            reviewNotes: user.verification.reviewNotes,
            documents: (user.verification.documents || []).map((doc: any) => ({
              id: doc.id,
              documentType: doc.documentType,
              originalFileName: doc.originalFileName,
              mimeType: doc.mimeType,
              fileSizeBytes: doc.fileSizeBytes,
              uploadedAt: doc.uploadedAt,
            })),
            submittedAt: user.verification.submittedAt,
            reviewedAt: user.verification.reviewedAt,
          }
        : null,
      wallets,
    };
  }
}

export const userManagementService = new UserManagementService();
