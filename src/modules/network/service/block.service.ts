import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { BlockStatus, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Computes a synthetic Merkle Root from transaction hashes.
 */
export function computeMerkleRoot(txHashes: string[]): string {
  if (txHashes.length === 0) {
    return "0x0000000000000000000000000000000000000000000000000000000000000000";
  }

  let currentLevel = txHashes.map((h) => (h.startsWith("0x") ? h.slice(2) : h));

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = crypto
        .createHash("sha256")
        .update(left + right)
        .digest("hex");
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }

  return `0x${currentLevel[0]}`;
}

/**
 * Computes a deterministic SHA-256 block hash.
 */
export function computeBlockHash(header: {
  height: bigint;
  parentHash: string;
  merkleRoot: string;
  timestamp: number;
}): string {
  const payload = `${header.height.toString()}-${header.parentHash}-${header.merkleRoot}-${header.timestamp}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return `0x${hash}`;
}

/**
 * Mints the next block, packaging up to maxTransactions from mempool.
 */
export async function mintNextBlock(maxTransactions = 50) {
  const latestBlock = await prisma.block.findFirst({
    orderBy: { height: "desc" },
  });

  const nextHeight = latestBlock ? latestBlock.height + 1n : 1n;
  const parentHash = latestBlock
    ? latestBlock.blockHash
    : "0x0000000000000000000000000000000000000000000000000000000000000000";

  // 1. Fetch pending transactions from Mempool
  const pendingTxs = await prisma.transaction.findMany({
    where: {
      status: {
        in: [TransactionStatus.QUEUED, TransactionStatus.IN_MEMPOOL],
      },
    },
    take: maxTransactions,
    orderBy: { createdAt: "asc" },
  });

  const txHashes = pendingTxs.map((t) => t.txHash);
  const merkleRoot = computeMerkleRoot(txHashes);
  const timestamp = Math.floor(Date.now() / 1000);
  const blockHash = computeBlockHash({
    height: nextHeight,
    parentHash,
    merkleRoot,
    timestamp,
  });

  const totalGasUsed = pendingTxs.reduce(
    (sum, tx) => sum.plus(new Decimal(tx.fee)),
    new Decimal(0)
  );

  return prisma.$transaction(async (tx) => {
    // Create Block
    const block = await tx.block.create({
      data: {
        height: nextHeight,
        blockHash,
        parentHash,
        merkleRoot,
        status: BlockStatus.SEALED,
        transactionCount: pendingTxs.length,
        gasUsed: totalGasUsed,
      },
    });

    // Assign transactions to Block
    for (let index = 0; index < pendingTxs.length; index++) {
      const pendingTx = pendingTxs[index];

      await tx.blockTransaction.create({
        data: {
          blockId: block.id,
          transactionId: pendingTx.id,
          txIndex: index,
        },
      });

      await tx.transaction.update({
        where: { id: pendingTx.id },
        data: {
          blockId: block.id,
          blockHeight: nextHeight,
          status: TransactionStatus.BLOCK_ASSIGNED,
          confirmations: 1,
        },
      });

      await tx.transactionEvent.create({
        data: {
          transactionId: pendingTx.id,
          fromStatus: pendingTx.status,
          toStatus: TransactionStatus.BLOCK_ASSIGNED,
          metadata: {
            blockHeight: nextHeight.toString(),
            blockHash,
          },
        },
      });
    }

    return block;
  });
}
