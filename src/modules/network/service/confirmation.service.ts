import { prisma } from "@/lib/prisma";
import { AccountType, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getWalletAccount, getOrCreateSystemAccount } from "@/modules/ledger/repository/ledger.repository";
import { findWalletByAddress } from "@/modules/wallets/repository/wallet.repository";

/**
 * Advances confirmations for unconfirmed transactions and finalizes them upon reaching required confirmations.
 */
export async function advanceConfirmations(requiredConfirmations = 3) {
  // Find transactions currently assigned to blocks or confirming
  const unconfirmedTxs = await prisma.transaction.findMany({
    where: {
      status: {
        in: [TransactionStatus.BLOCK_ASSIGNED, TransactionStatus.CONFIRMING],
      },
    },
  });

  const settledTxIds: string[] = [];

  for (const tx of unconfirmedTxs) {
    const newConfirmations = tx.confirmations + 1;

    if (newConfirmations >= requiredConfirmations) {
      // Finalize transaction and settle double-entry ledger postings
      await finalizeTransaction(tx.id);
      settledTxIds.push(tx.id);
    } else {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          confirmations: newConfirmations,
          status: TransactionStatus.CONFIRMING,
        },
      });

      await prisma.transactionEvent.create({
        data: {
          transactionId: tx.id,
          toStatus: TransactionStatus.CONFIRMING,
          metadata: {
            confirmations: newConfirmations,
          },
        },
      });
    }
  }

  return {
    advancedCount: unconfirmedTxs.length,
    settledCount: settledTxIds.length,
  };
}

/**
 * Finalizes a transaction in the double-entry ledger:
 * 1. Sender Reserved Account -> Debited to Zero
 * 2. Recipient Available Account -> Credited by Amount
 * 3. Network Gas Fee Pool -> Credited by Fee
 */
export async function finalizeTransaction(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { asset: true },
  });

  if (!transaction) return null;

  const recipientWallet = await findWalletByAddress(transaction.toAddress);
  const senderWallet = await findWalletByAddress(transaction.fromAddress);

  if (!recipientWallet || !senderWallet) {
    throw new Error("Sender or recipient wallet could not be resolved for settlement.");
  }

  const senderReservedAcc = await getWalletAccount(senderWallet.id, AccountType.RESERVED_PENDING);
  const recipientAvailableAcc = await getWalletAccount(recipientWallet.id, AccountType.AVAILABLE);
  const gasFeeAcc = await getOrCreateSystemAccount(AccountType.SYSTEM_GAS_FEE, transaction.assetId);

  if (!senderReservedAcc || !recipientAvailableAcc) {
    throw new Error("Ledger accounts missing during final settlement.");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Mark transaction as CONFIRMED
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.CONFIRMED,
        confirmations: 3,
      },
    });

    // 2. Post final settlement ledger entries
    await tx.ledgerEntry.createMany({
      data: [
        // A. Release funds from Sender's Reserved Account
        {
          transactionId: transaction.id,
          accountId: senderReservedAcc.id,
          debit: new Decimal(0),
          credit: transaction.totalDebit, // Decrements reserved account back to zero
        },
        // B. Credit recipient available balance
        {
          transactionId: transaction.id,
          accountId: recipientAvailableAcc.id,
          debit: transaction.amount, // Increases recipient available balance
          credit: new Decimal(0),
        },
        // C. Credit gas fee pool
        {
          transactionId: transaction.id,
          accountId: gasFeeAcc.id,
          debit: transaction.fee, // Increases network fee pool
          credit: new Decimal(0),
        },
      ],
    });

    // 3. Record confirmation event
    await tx.transactionEvent.create({
      data: {
        transactionId: transaction.id,
        fromStatus: transaction.status,
        toStatus: TransactionStatus.CONFIRMED,
        metadata: {
          settledAt: new Date().toISOString(),
          recipientAvailableCredited: transaction.amount.toString(),
          gasFeeCredited: transaction.fee.toString(),
        },
      },
    });
  });
}
