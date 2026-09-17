import {
  findLatestBlocks,
  findLatestTransactions,
  findBlockByHeight,
  findBlockByHash,
  findTransactionByHash,
  findAddressRecord,
  findTransactionsByAddress,
  getExplorerStatsSummary,
  PaginationParams,
} from "../repository/explorer.repository";
import { validateAddressChecksum } from "@/modules/wallets/service/address.service";
import { AccountType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export function serializeBlock(block: any) {
  if (!block) return null;
  return {
    id: block.id,
    height: block.height.toString(),
    blockHash: block.blockHash,
    parentHash: block.parentHash,
    merkleRoot: block.merkleRoot,
    status: block.status,
    transactionCount: block.transactionCount,
    gasUsed: block.gasUsed ? (block.gasUsed.toFixed ? block.gasUsed.toFixed(8) : block.gasUsed.toString()) : "0.00000000",
    createdAt: block.createdAt,
    transactions: block.transactions
      ? block.transactions.map(serializeTransaction)
      : undefined,
    blockTransactions: block.blockTransactions
      ? block.blockTransactions.map((bt: any) => ({
          id: bt.id,
          txIndex: bt.txIndex,
          transaction: serializeTransaction(bt.transaction),
        }))
      : undefined,
  };
}

export function serializeTransaction(tx: any) {
  if (!tx) return null;
  return {
    id: tx.id,
    txHash: tx.txHash,
    idempotencyKey: tx.idempotencyKey,
    type: tx.type,
    status: tx.status,
    assetId: tx.assetId,
    assetSymbol: tx.asset?.symbol || "CC",
    initiatorUserId: tx.initiatorUserId,
    fromAddress: tx.fromAddress,
    toAddress: tx.toAddress,
    amount: tx.amount ? (tx.amount.toFixed ? tx.amount.toFixed(8) : tx.amount.toString()) : "0.00000000",
    fee: tx.fee ? (tx.fee.toFixed ? tx.fee.toFixed(8) : tx.fee.toString()) : "0.50000000",
    totalDebit: tx.totalDebit ? (tx.totalDebit.toFixed ? tx.totalDebit.toFixed(8) : tx.totalDebit.toString()) : "0.00000000",
    blockId: tx.blockId,
    blockHeight: tx.blockHeight ? tx.blockHeight.toString() : null,
    confirmations: tx.confirmations,
    note: tx.note,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    block: tx.block
      ? {
          height: tx.block.height.toString(),
          blockHash: tx.block.blockHash,
        }
      : undefined,
    events: tx.events || undefined,
  };
}

export async function getBlocks(params: PaginationParams = {}) {
  const result = await findLatestBlocks(params);
  return {
    blocks: result.blocks.map(serializeBlock),
    totalBlocks: result.totalBlocks,
    page: result.page,
    limit: result.limit,
  };
}

export async function getTransactions(params: PaginationParams = {}) {
  const result = await findLatestTransactions(params);
  return {
    transactions: result.transactions.map(serializeTransaction),
    totalTransactions: result.totalTransactions,
    page: result.page,
    limit: result.limit,
  };
}

export async function getBlockDetails(identifier: string) {
  const trimmed = identifier.trim();
  let block = null;

  if (/^\d+$/.test(trimmed)) {
    block = await findBlockByHeight(BigInt(trimmed));
  } else {
    block = await findBlockByHash(trimmed);
  }

  if (!block) return null;
  return serializeBlock(block);
}

export async function getTransactionDetails(txHash: string) {
  const tx = await findTransactionByHash(txHash.trim());
  if (!tx) return null;
  return serializeTransaction(tx);
}

export async function getAddressDetails(address: string, pagination: PaginationParams = {}) {
  const trimmed = address.trim();
  const addressRecord = await findAddressRecord(trimmed);
  const txResult = await findTransactionsByAddress(trimmed, pagination);

  // Derive available, reserved and total balance
  let availableBalance = new Decimal(0);
  let reservedBalance = new Decimal(0);

  if (addressRecord?.wallet?.ledgerAccounts) {
    for (const acc of addressRecord.wallet.ledgerAccounts) {
      let net = new Decimal(0);
      for (const entry of acc.entries) {
        net = net.plus(entry.debit).minus(entry.credit);
      }
      if (acc.accountType === AccountType.AVAILABLE) {
        availableBalance = net;
      } else if (acc.accountType === AccountType.RESERVED_PENDING) {
        reservedBalance = net;
      }
    }
  }

  const totalBalance = availableBalance.plus(reservedBalance);

  // Calculate total sent & received from transactions
  let totalSent = new Decimal(0);
  let totalReceived = new Decimal(0);

  for (const tx of txResult.transactions) {
    if (tx.fromAddress.toLowerCase() === trimmed.toLowerCase()) {
      totalSent = totalSent.plus(tx.amount);
    }
    if (tx.toAddress.toLowerCase() === trimmed.toLowerCase()) {
      totalReceived = totalReceived.plus(tx.amount);
    }
  }

  return {
    address: trimmed,
    isValidChecksum: validateAddressChecksum(trimmed),
    displayName: addressRecord?.wallet?.user?.displayName || "External Address",
    assetSymbol: addressRecord?.wallet?.asset?.symbol || "CC",
    balances: {
      available: availableBalance.toFixed(8),
      reserved: reservedBalance.toFixed(8),
      total: totalBalance.toFixed(8),
    },
    metrics: {
      totalSent: totalSent.toFixed(8),
      totalReceived: totalReceived.toFixed(8),
      transactionCount: txResult.total,
    },
    transactions: txResult.transactions.map(serializeTransaction),
    pagination: {
      page: txResult.page,
      limit: txResult.limit,
      total: txResult.total,
    },
  };
}

export async function resolveUniversalSearch(query: string) {
  const clean = query.trim();
  if (!clean) {
    return { found: false, error: "Empty search query" };
  }

  // 1. Check if numeric -> Block Height
  if (/^\d+$/.test(clean)) {
    const block = await findBlockByHeight(BigInt(clean));
    if (block) {
      return {
        found: true,
        type: "block",
        target: clean,
        data: serializeBlock(block),
      };
    }
  }

  // 2. Check if Address (starts with [SYMBOL]0x)
  if (/^[A-Z0-9]{2,6}0x[a-fA-F0-9]{40}$/i.test(clean)) {
    const addr = await findAddressRecord(clean);
    const txs = await findTransactionsByAddress(clean, { limit: 1 });
    if (addr || txs.total > 0 || validateAddressChecksum(clean)) {
      return {
        found: true,
        type: "address",
        target: clean,
      };
    }
  }

  // 3. Check if 64/66-character Hash -> Transaction Hash or Block Hash
  const formattedHash = clean.startsWith("0x") ? clean : `0x${clean}`;
  if (/^0x[a-fA-F0-9]{64}$/.test(formattedHash)) {
    const tx = await findTransactionByHash(formattedHash);
    if (tx) {
      return {
        found: true,
        type: "tx",
        target: tx.txHash,
        data: serializeTransaction(tx),
      };
    }

    const block = await findBlockByHash(formattedHash);
    if (block) {
      return {
        found: true,
        type: "block",
        target: block.height.toString(),
        data: serializeBlock(block),
      };
    }
  }

  return { found: false, error: "No matching block, transaction, or address found" };
}

export async function getExplorerStats(assetSymbol?: string) {
  return getExplorerStatsSummary(assetSymbol);
}
