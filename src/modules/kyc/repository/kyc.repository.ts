import { prisma } from "@/lib/prisma";
import { KycVerificationStatus, UserVerification, KycDocument } from "@prisma/client";

export async function findVerificationByUserId(userId: string) {
  return prisma.userVerification.findUnique({
    where: { userId },
    include: {
      documents: true,
      user: {
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      },
    },
  });
}

export async function findVerificationById(id: string) {
  return prisma.userVerification.findUnique({
    where: { id },
    include: {
      documents: true,
      user: {
        include: {
          profile: true,
          roles: { include: { role: true } },
        },
      },
    },
  });
}

export async function createVerification(data: {
  userId: string;
  ssnEncrypted: string;
  ssnIv: string;
  ssnAuthTag: string;
  status: KycVerificationStatus;
  submittedAt?: Date;
}) {
  return prisma.userVerification.create({
    data: {
      userId: data.userId,
      ssnEncrypted: data.ssnEncrypted,
      ssnIv: data.ssnIv,
      ssnAuthTag: data.ssnAuthTag,
      status: data.status,
      submittedAt: data.submittedAt || new Date(),
    },
    include: {
      documents: true,
    },
  });
}

export async function updateVerificationStatus(
  id: string,
  status: KycVerificationStatus,
  reviewData?: {
    reviewNotes?: string | null;
    reviewedByUserId?: string | null;
    reviewedAt?: Date | null;
  }
) {
  return prisma.userVerification.update({
    where: { id },
    data: {
      status,
      reviewNotes: reviewData?.reviewNotes,
      reviewedByUserId: reviewData?.reviewedByUserId,
      reviewedAt: reviewData?.reviewedAt || new Date(),
    },
    include: {
      documents: true,
    },
  });
}
