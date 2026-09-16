import { prisma } from "@/lib/prisma";
import { AccountType, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface PaginationParams {
  limit?: number;
  page?: number;
}

export async function findLatestBlocks({ limit = 10, page = 1 }: PaginationParams = {}) {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [blocks, totalBlocks] = await Promise.all([
    prisma.block.findMany({
      skip,
      take: safeLimit,
      orderBy: { height: "desc" },
    }),
    prisma.block.count(),
  ]);

  return { blocks, totalBlocks, page: safePage, limit: safeLimit };
}

export async function findLatestTransactions({ limit = 10, page = 1 }: PaginationParams = {}) {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [transactions, totalTransactions] = await Promise.all([
    prisma.transaction.findMany({
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        block: {
          select: {
            height: true,
            blockHash: true,
          },
        },
      },
    }),
    prisma.transaction.count(),
  ]);

  return { transactions, totalTransactions, page: safePage, limit: safeLimit };
}

export async function findBlockByHeight(height: bigint) {
  return prisma.block.findUnique({
    where: { height },
    include: {
      blockTransactions: {
        include: {
          transaction: true,
        },
        orderBy: { txIndex: "asc" },
      },
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function findBlockByHash(blockHash: string) {
  return prisma.block.findUnique({
    where: { blockHash },
    include: {
      blockTransactions: {
        include: {
          transaction: true,
        },
        orderBy: { txIndex: "asc" },
      },
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function findTransactionByHash(txHash: string) {
  return prisma.transaction.findUnique({
    where: { txHash },
    include: {
      block: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
      ledgerEntries: {
        include: {
          account: true,
        },
      },
    },
  });
}

export async function findAddressRecord(address: string) {
  return prisma.walletAddress.findUnique({
    where: { address },
    include: {
      wallet: {
        include: {
          user: {
            select: {
              displayName: true,
            },
          },
          ledgerAccounts: {
            include: {
              entries: true,
            },
          },
        },
      },
    },
  });
}

export async function findTransactionsByAddress(address: string, { limit = 20, page = 1 }: PaginationParams = {}) {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        OR: [{ fromAddress: address }, { toAddress: address }],
      },
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        block: {
          select: {
            height: true,
          },
        },
      },
    }),
    prisma.transaction.count({
      where: {
        OR: [{ fromAddress: address }, { toAddress: address }],
      },
    }),
  ]);

  return { transactions, total, page: safePage, limit: safeLimit };
}

export async function getExplorerStatsSummary() {
  const [latestBlock, totalBlocks, totalTransactions, gasAgg, activeWallets, availableEntries] = await Promise.all([
    prisma.block.findFirst({
      orderBy: { height: "desc" },
    }),
    prisma.block.count(),
    prisma.transaction.count(),
    prisma.block.aggregate({
      _sum: {
        gasUsed: true,
      },
    }),
    prisma.walletAddress.count(),
    prisma.ledgerEntry.findMany({
      where: {
        account: {
          accountType: AccountType.AVAILABLE,
        },
      },
      select: {
        debit: true,
        credit: true,
      },
    }),
  ]);

  // Derive net circulating supply from available ledger entries
  let circulatingSupply = new Decimal(0);
  for (const entry of availableEntries) {
    circulatingSupply = circulatingSupply.plus(entry.debit).minus(entry.credit);
  }

  return {
    blockHeight: latestBlock ? latestBlock.height.toString() : "0",
    latestBlockHash: latestBlock?.blockHash || null,
    latestBlockTime: latestBlock?.createdAt || null,
    totalBlocks,
    totalTransactions,
    totalGasUsed: gasAgg._sum.gasUsed ? gasAgg._sum.gasUsed.toFixed(8) : "0.00000000",
    blockTimeSeconds: 10,
    activeAddresses: activeWallets,
    circulatingSupply: circulatingSupply.toFixed(8),
  };
}
