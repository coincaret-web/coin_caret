import { prisma } from "@/lib/prisma";
import { postTreasuryMint, getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { Decimal } from "@prisma/client/runtime/library";

export interface TreasuryMintInput {
  recipientWalletId: string;
  amount: string | number;
  reason: string;
  actorUserId?: string;
  ipAddress?: string;
}

export async function executeTreasuryMint(input: TreasuryMintInput) {
  const amountDecimal = new Decimal(input.amount);
  if (amountDecimal.lte(0)) {
    throw new Error("Mint amount must be strictly greater than zero.");
  }

  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error("Reason code or memo is mandatory for institutional treasury mints.");
  }

  const wallet = await prisma.wallet.findUnique({
    where: { id: input.recipientWalletId },
    include: { addresses: true, user: true },
  });

  if (!wallet) {
    throw new Error("Recipient wallet could not be found.");
  }

  const initialBalance = await getWalletBalance(wallet.id);

  // 1. Post atomic treasury ledger transaction
  const tx = await postTreasuryMint({
    recipientWalletId: wallet.id,
    amount: amountDecimal.toFixed(8),
    reason: input.reason,
    actorUserId: input.actorUserId,
  });

  // 2. Record TreasuryIssuanceRequest
  const issuance = await prisma.treasuryIssuanceRequest.create({
    data: {
      requesterId: input.actorUserId || (wallet.userId as string),
      approverId: input.actorUserId || null,
      recipientWalletId: wallet.id,
      amount: amountDecimal,
      reason: input.reason,
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  const finalBalance = await getWalletBalance(wallet.id);

  // 3. Create immutable AuditLog
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId || null,
      action: "TREASURY_MINT",
      entityType: "TREASURY_MINT",
      entityId: issuance.id,
      beforeState: {
        walletId: wallet.id,
        userEmail: wallet.user?.email || null,
        availableBalance: initialBalance.available.toFixed(8),
      },
      afterState: {
        walletId: wallet.id,
        userEmail: wallet.user?.email || null,
        amount: amountDecimal.toFixed(8),
        availableBalance: finalBalance.available.toFixed(8),
        txHash: tx.txHash,
        reason: input.reason,
      },
      ipAddress: input.ipAddress || null,
    },
  });

  return {
    success: true,
    transactionId: tx.id,
    txHash: tx.txHash,
    issuanceId: issuance.id,
    newBalance: finalBalance.available.toFixed(8),
  };
}

export async function getRecentIssuances(limit = 20) {
  return prisma.treasuryIssuanceRequest.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, email: true, displayName: true } },
      approver: { select: { id: true, email: true, displayName: true } },
    },
  });
}
