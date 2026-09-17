import { prisma as defaultPrisma } from "@/lib/prisma";
import { KycAccessStatus } from "@/types/user";

export class KycGateService {
  constructor(private prisma: any = defaultPrisma) {}

  async getAccessStatus(userId: string): Promise<KycAccessStatus> {
    // 1. Fetch platform-wide KYC_REQUIRED config
    const kycRequiredConfig = await this.prisma.platformConfig.findUnique({
      where: { key: "KYC_REQUIRED" },
    });

    if (kycRequiredConfig && kycRequiredConfig.value === "false") {
      return "FULL_ACCESS";
    }

    // 2. Fetch user's per-user kycRequired setting
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, kycRequired: true },
    });

    if (!user) {
      return "NEEDS_UPLOAD";
    }

    if (user.kycRequired === false) {
      return "FULL_ACCESS";
    }

    // 3. Fetch user's verification record
    const verification = await this.prisma.userVerification.findUnique({
      where: { userId },
    });

    if (!verification || verification.status === "NOT_SUBMITTED") {
      return "NEEDS_UPLOAD";
    }

    if (verification.status === "PENDING_REVIEW" || verification.status === "SUBMITTED") {
      return "AWAITING_REVIEW";
    }

    if (verification.status === "REJECTED") {
      return "REJECTED_REUPLOAD";
    }

    if (verification.status === "APPROVED") {
      return "FULL_ACCESS";
    }

    return "NEEDS_UPLOAD";
  }
}

export const kycGateService = new KycGateService();
