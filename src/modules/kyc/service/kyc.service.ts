import { prisma } from "@/lib/prisma";
import { KycVerificationStatus, KycDocumentType } from "@prisma/client";
import { encryptSsn } from "./kyc-encryption.service";
import { documentStorageService } from "./document-storage.service";
import { findVerificationByUserId, updateVerificationStatus } from "../repository/kyc.repository";

export class AlreadySubmittedError extends Error {
  constructor(message = "KYC verification documents have already been submitted and are being processed.") {
    super(message);
    this.name = "AlreadySubmittedError";
  }
}

export interface DocumentUploadInput {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  buffer: Buffer;
}

export interface SubmitVerificationInput {
  userId: string;
  ssnPlaintext: string;
  documents: {
    ssnCard: DocumentUploadInput;
    federalId: DocumentUploadInput;
    drivingLicense: DocumentUploadInput;
  };
}

export class KycService {
  async submitVerification(input: SubmitVerificationInput) {
    const existing = await findVerificationByUserId(input.userId);
    if (existing && existing.status !== KycVerificationStatus.REJECTED) {
      throw new AlreadySubmittedError();
    }

    // 1. Encrypt SSN (AES-256-GCM)
    const { encrypted, iv, authTag } = encryptSsn(input.ssnPlaintext);

    // 2. Fetch platform review mode config
    const reviewModeConfig = await prisma.platformConfig.findUnique({
      where: { key: "KYC_REVIEW_MODE" },
    });
    const reviewMode = reviewModeConfig?.value || "automatic";
    const initialStatus =
      reviewMode === "automatic"
        ? KycVerificationStatus.APPROVED
        : KycVerificationStatus.PENDING_REVIEW;

    let verificationId: string;

    if (existing && existing.status === KycVerificationStatus.REJECTED) {
      // Re-submission flow
      const updated = await prisma.userVerification.update({
        where: { id: existing.id },
        data: {
          ssnEncrypted: encrypted,
          ssnIv: iv,
          ssnAuthTag: authTag,
          status: initialStatus,
          reviewNotes: null,
          reviewedByUserId: null,
          reviewedAt: null,
          submittedAt: new Date(),
        },
      });
      verificationId = updated.id;
    } else {
      // New submission
      const created = await prisma.userVerification.create({
        data: {
          userId: input.userId,
          ssnEncrypted: encrypted,
          ssnIv: iv,
          ssnAuthTag: authTag,
          status: initialStatus,
          submittedAt: new Date(),
        },
      });
      verificationId = created.id;
    }

    // 3. Save 3 documents via DocumentStorageService
    await documentStorageService.save({
      userVerificationId: verificationId,
      documentType: KycDocumentType.SSN_CARD,
      fileName: input.documents.ssnCard.fileName,
      mimeType: input.documents.ssnCard.mimeType,
      fileSizeBytes: input.documents.ssnCard.fileSizeBytes,
      buffer: input.documents.ssnCard.buffer,
    });

    await documentStorageService.save({
      userVerificationId: verificationId,
      documentType: KycDocumentType.FEDERAL_ID,
      fileName: input.documents.federalId.fileName,
      mimeType: input.documents.federalId.mimeType,
      fileSizeBytes: input.documents.federalId.fileSizeBytes,
      buffer: input.documents.federalId.buffer,
    });

    await documentStorageService.save({
      userVerificationId: verificationId,
      documentType: KycDocumentType.DRIVING_LICENSE,
      fileName: input.documents.drivingLicense.fileName,
      mimeType: input.documents.drivingLicense.mimeType,
      fileSizeBytes: input.documents.drivingLicense.fileSizeBytes,
      buffer: input.documents.drivingLicense.buffer,
    });

    // 4. Audit Log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: input.userId,
        action: "KYC_SUBMITTED",
        entityType: "UserVerification",
        entityId: verificationId,
        afterState: {
          status: initialStatus,
          reviewMode,
          documentCount: 3,
        },
      },
    });

    return {
      verificationId,
      status: initialStatus,
    };
  }

  async getVerificationStatus(userId: string) {
    const verification = await findVerificationByUserId(userId);
    if (!verification) {
      return {
        status: KycVerificationStatus.NOT_SUBMITTED,
        reviewNotes: null,
        submittedAt: null,
      };
    }

    return {
      status: verification.status,
      reviewNotes: verification.reviewNotes,
      submittedAt: verification.submittedAt,
    };
  }

  async approveVerification(params: {
    verificationId: string;
    reviewerUserId: string;
    notes?: string;
  }) {
    const updated = await updateVerificationStatus(
      params.verificationId,
      KycVerificationStatus.APPROVED,
      {
        reviewedByUserId: params.reviewerUserId,
        reviewNotes: params.notes || "Identity verification approved by compliance.",
        reviewedAt: new Date(),
      }
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: params.reviewerUserId,
        action: "KYC_APPROVED",
        entityType: "UserVerification",
        entityId: params.verificationId,
        afterState: {
          status: KycVerificationStatus.APPROVED,
          notes: params.notes,
        },
      },
    });

    return updated;
  }

  async rejectVerification(params: {
    verificationId: string;
    reviewerUserId: string;
    notes: string;
  }) {
    const updated = await updateVerificationStatus(
      params.verificationId,
      KycVerificationStatus.REJECTED,
      {
        reviewedByUserId: params.reviewerUserId,
        reviewNotes: params.notes,
        reviewedAt: new Date(),
      }
    );

    await prisma.auditLog.create({
      data: {
        actorUserId: params.reviewerUserId,
        action: "KYC_REJECTED",
        entityType: "UserVerification",
        entityId: params.verificationId,
        afterState: {
          status: KycVerificationStatus.REJECTED,
          notes: params.notes,
        },
      },
    });

    return updated;
  }
}

export const kycService = new KycService();
