-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SWAP';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "linkedTransactionId" TEXT;

-- CreateTable
CREATE TABLE "asset_pair_rates" (
    "id" TEXT NOT NULL,
    "fromAssetId" TEXT NOT NULL,
    "toAssetId" TEXT NOT NULL,
    "rate" DECIMAL(28,8) NOT NULL,
    "setByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_pair_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_pair_rates_fromAssetId_idx" ON "asset_pair_rates"("fromAssetId");

-- CreateIndex
CREATE INDEX "asset_pair_rates_toAssetId_idx" ON "asset_pair_rates"("toAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_pair_rates_fromAssetId_toAssetId_key" ON "asset_pair_rates"("fromAssetId", "toAssetId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_pair_rates" ADD CONSTRAINT "asset_pair_rates_fromAssetId_fkey" FOREIGN KEY ("fromAssetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_pair_rates" ADD CONSTRAINT "asset_pair_rates_toAssetId_fkey" FOREIGN KEY ("toAssetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_pair_rates" ADD CONSTRAINT "asset_pair_rates_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
