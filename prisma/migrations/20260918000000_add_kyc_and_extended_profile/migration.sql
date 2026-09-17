-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('SSN_CARD', 'FEDERAL_ID', 'DRIVING_LICENSE');

-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "phoneNumber" TEXT NOT NULL,
ADD COLUMN "address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "kycRequired" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ssnEncrypted" TEXT NOT NULL,
    "ssnIv" TEXT NOT NULL,
    "ssnAuthTag" TEXT NOT NULL,
    "status" "KycVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "userVerificationId" TEXT NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageBackend" TEXT NOT NULL DEFAULT 'postgres',
    "storageRef" TEXT NOT NULL,
    "base64Data" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_userId_key" ON "user_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_documents_userVerificationId_idx" ON "kyc_documents"("userVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_documents_userVerificationId_documentType_key" ON "kyc_documents"("userVerificationId", "documentType");

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_userVerificationId_fkey" FOREIGN KEY ("userVerificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
