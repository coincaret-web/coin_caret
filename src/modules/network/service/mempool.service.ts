import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { getWalletAccount } from "@/modules/ledger/repository/ledger.repository";
import { validateAddressChecksum } from "@/modules/wallets/service/address.service";
import { getFeeForAsset } from "./fee-schedule.service";

export interface QueueTransactionInput {
  fromWalletId: string;
  toAddress: string;
  amount: Decimal | number | string;
  assetSymbol?: string;
  note?: string;
  idempotencyKey: string;
  initiatorUserId?: string;
}

export async function queueTransaction(input: QueueTransactionInput) {
  const amount = new Decimal(input.amount);

  if (amount.lte(0)) {
    throw new Error("Transaction amount must be strictly greater than zero.");
  }

  // 1. Fetch sender wallet and balance
  const senderWallet = await prisma.wallet.findUnique({
    where: { id: input.fromWalletId },
    include: { addresses: true, asset: true },
  });

  if (!senderWallet || senderWallet.isFrozen) {
    throw new Error("Sender wallet is not found or is currently frozen.");
  }

  const assetSymbol = senderWallet.asset.symbol;

  // 2. Validate recipient address format and checksum
  if (!validateAddressChecksum(input.toAddress)) {
    throw new Error("Invalid destination wallet address checksum or format.");
  }

  // 3. Resolve dynamic gas fee for this asset
  const fee = await getFeeForAsset(assetSymbol);
  const totalDebit = amount.plus(fee);

  const senderBalance = await getWalletBalance(senderWallet.id);
  if (senderBalance.available.lt(totalDebit)) {
    throw new Error(
      `Insufficient available balance. Required: ${totalDebit.toFixed(8)} ${assetSymbol} (including ${fee.toFixed(8)} ${assetSymbol} gas fee), Available: ${senderBalance.available.toFixed(8)} ${assetSymbol}.`
    );
  }

  // 4. Prevent sending to same address
  if (senderWallet.addresses[0]?.address.toLowerCase() === input.toAddress.toLowerCase()) {
    throw new Error("Self-transfers to the same wallet address are not permitted.");
  }

  // 5. Check idempotency
  const existingTx = await prisma.transaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existingTx) {
    return existingTx;
  }

  const senderAvailableAcc = await getWalletAccount(senderWallet.id, AccountType.AVAILABLE);
  const senderReservedAcc = await getWalletAccount(senderWallet.id, AccountType.RESERVED_PENDING);

  if (!senderAvailableAcc || !senderReservedAcc) {
    throw new Error("Sender ledger accounts not initialized.");
  }

  const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;

  return prisma.$transaction(async (tx) => {
    // A. Create Mempool Transaction Record
    const transaction = await tx.transaction.create({
      data: {
        txHash,
        idempotencyKey: input.idempotencyKey,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.IN_MEMPOOL,
        assetId: senderWallet.assetId,
        initiatorUserId: input.initiatorUserId,
        fromAddress: senderWallet.addresses[0]?.address ?? "UNKNOWN",
        toAddress: input.toAddress,
        amount,
        fee,
        totalDebit,
        note: input.note,
        confirmations: 0,
      },
    });

    // B. Atomically move funds from Available to Reserved
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: transaction.id,
          accountId: senderAvailableAcc.id,
          debit: new Decimal(0),
          credit: totalDebit, // Decrement available
        },
        {
          transactionId: transaction.id,
          accountId: senderReservedAcc.id,
          debit: totalDebit, // Increment reserved
          credit: new Decimal(0),
        },
      ],
    });

    // C. Record Event
    await tx.transactionEvent.create({
      data: {
        transactionId: transaction.id,
        toStatus: TransactionStatus.IN_MEMPOOL,
        metadata: {
          assetSymbol,
          availableDecremented: totalDebit.toString(),
          feeApplied: fee.toString(),
        },
      },
    });

    return transaction;
  });
}
