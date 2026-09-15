import { prisma } from "@/lib/prisma";
import { AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { deriveAccountBalance, calculateTransferEntries } from "./ledger-math";
import { getOrCreateSystemAccount, getWalletAccount, getAccountEntries } from "../repository/ledger.repository";
import crypto from "crypto";

export async function getWalletBalance(walletId: string) {
  const availableAcc = await getWalletAccount(walletId, AccountType.AVAILABLE);
  const reservedAcc = await getWalletAccount(walletId, AccountType.RESERVED_PENDING);

  if (!availableAcc) {
    return {
      available: new Decimal(0),
      reserved: new Decimal(0),
      total: new Decimal(0),
    };
  }

  const availableEntries = await getAccountEntries(availableAcc.id);
  const reservedEntries = reservedAcc ? await getAccountEntries(reservedAcc.id) : [];

  const available = deriveAccountBalance(availableEntries);
  const reserved = deriveAccountBalance(reservedEntries);
  const total = available.plus(reserved);

  return {
    available,
    reserved,
    total,
  };
}

export async function postTreasuryMint(input: {
  recipientWalletId: string;
  amount: Decimal | number | string;
  reason: string;
  actorUserId?: string;
}) {
  const amount = new Decimal(input.amount);
  if (amount.lte(0)) {
    throw new Error("Mint amount must be greater than zero.");
  }

  const recipientWallet = await prisma.wallet.findUnique({
    where: { id: input.recipientWalletId },
    include: { addresses: true, asset: true },
  });

  if (!recipientWallet) {
    throw new Error("Recipient wallet not found.");
  }

  const recipientAvailableAcc = await getWalletAccount(recipientWallet.id, AccountType.AVAILABLE);
  if (!recipientAvailableAcc) {
    throw new Error("Recipient available account not found.");
  }

  const treasuryAcc = await getOrCreateSystemAccount(AccountType.SYSTEM_TREASURY, recipientWallet.assetId);
  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const idempotencyKey = `mint-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create Transaction
    const transaction = await tx.transaction.create({
      data: {
        txHash,
        idempotencyKey,
        type: TransactionType.TREASURY_MINT,
        status: TransactionStatus.CONFIRMED,
        assetId: recipientWallet.assetId,
        fromAddress: "TREASURY_ISSUANCE",
        toAddress: recipientWallet.addresses[0]?.address ?? "UNKNOWN",
        amount,
        fee: new Decimal(0),
        totalDebit: amount,
        note: input.reason,
        confirmations: 3,
      },
    });

    // 2. Post balanced ledger entries (Debit Treasury, Credit Recipient)
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: transaction.id,
          accountId: treasuryAcc.id,
          debit: new Decimal(0),
          credit: amount, // Decreases system treasury
        },
        {
          transactionId: transaction.id,
          accountId: recipientAvailableAcc.id,
          debit: amount, // Increases recipient available balance
          credit: new Decimal(0),
        },
      ],
    });

    // 3. Log Audit Record
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "TREASURY_MINT",
        entityType: "Wallet",
        entityId: recipientWallet.id,
        afterState: {
          amount: amount.toString(),
          reason: input.reason,
          recipientAddress: recipientWallet.addresses[0]?.address,
        },
      },
    });

    return transaction;
  });
}
