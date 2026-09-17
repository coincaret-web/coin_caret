import { KycVerificationStatus, KycDocumentType, RoleName, UserStatus } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  phoneNumber: z.string().min(7, "Phone number must be at least 7 characters").max(20),
  address: z.string().min(10, "Address must be at least 10 characters").max(500),
});

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
}

export interface UserProfileDto {
  id: string;
  userId: string;
  phoneNumber: string;
  address: string;
  themePreference: string;
  currencyDisplay: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  kycRequired: boolean;
  role: RoleName;
  profile?: UserProfileDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycSubmitRequest {
  ssn: string;
  /* files handled as FormData */
}

export interface KycStatusResponse {
  status: KycVerificationStatus;
  reviewNotes?: string | null;
  submittedAt?: string | null;
}

export interface KycDocumentDto {
  id: string;
  documentType: KycDocumentType;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string | Date;
}

export interface UserVerificationDto {
  id: string;
  userId: string;
  status: KycVerificationStatus;
  reviewNotes?: string | null;
  documents: KycDocumentDto[];
  submittedAt?: string | Date | null;
  reviewedAt?: string | Date | null;
}

export type KycAccessStatus = "FULL_ACCESS" | "NEEDS_UPLOAD" | "AWAITING_REVIEW" | "REJECTED_REUPLOAD";
