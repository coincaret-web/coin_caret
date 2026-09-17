import { prisma as defaultPrisma } from "@/lib/prisma";

export interface FindAllUsersParams {
  search?: string;
  skip?: number;
  take?: number;
}

export class UserManagementRepository {
  constructor(private prisma: any = defaultPrisma) {}

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        verification: {
          include: {
            documents: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
        wallets: {
          include: {
            asset: true,
            addresses: true,
            ledgerAccounts: true,
          },
        },
      },
    });
  }

  async updateKycRequired(userId: string, kycRequired: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { kycRequired },
      include: {
        profile: true,
        verification: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findAllUsers({ search, skip = 0, take = 20 }: FindAllUsersParams) {
    const where: any = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        verification: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async countUsers(search?: string): Promise<number> {
    const where: any = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.user.count({ where });
  }
}

export const userManagementRepository = new UserManagementRepository();
