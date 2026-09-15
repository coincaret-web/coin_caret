import { prisma } from "@/lib/prisma";
import { AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export async function getOrCreateSystemAccount(accountType: AccountType, assetId: string) {
  let account = await prisma.ledgerAccount.findFirst({
    where: {
      walletId: null,
      accountType,
      assetId,
    },
  });

  if (!account) {
    account = await prisma.ledgerAccount.create({
      data: {
        walletId: null,
        accountType,
        assetId,
      },
    });
  }

  return account;
}

export async function getWalletAccount(walletId: string, accountType: AccountType) {
  return prisma.ledgerAccount.findFirst({
    where: {
      walletId,
      accountType,
    },
  });
}

export async function getAccountEntries(accountId: string) {
  return prisma.ledgerEntry.findMany({
    where: { accountId },
    select: {
      debit: true,
      credit: true,
    },
  });
}
