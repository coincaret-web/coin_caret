import { INetworkEngine, FeeSchedule, BroadcastTransactionInput, BroadcastTransactionResult, BlockHeaderData } from "../engine.interface";
import { queueTransaction } from "../service/mempool.service";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class InternalNetworkEngine implements INetworkEngine {
  async getFeeSchedule(): Promise<FeeSchedule> {
    return {
      assetSymbol: "CC",
      standardFee: new Decimal(process.env.STANDARD_FEE_CC ?? "0.50"),
      blockIntervalMs: Number(process.env.BLOCK_INTERVAL_MS ?? "10000"),
      requiredConfirmations: Number(process.env.REQUIRED_CONFIRMATIONS ?? "3"),
    };
  }

  async broadcastTx(input: BroadcastTransactionInput): Promise<BroadcastTransactionResult> {
    const tx = await queueTransaction(input);
    return {
      txHash: tx.txHash,
      status: tx.status,
      fee: tx.fee,
      amount: tx.amount,
      totalDebit: tx.totalDebit,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
    };
  }

  async getLatestBlock(): Promise<BlockHeaderData | null> {
    const block = await prisma.block.findFirst({
      orderBy: { height: "desc" },
    });

    if (!block) return null;

    return {
      height: block.height,
      blockHash: block.blockHash,
      parentHash: block.parentHash,
      merkleRoot: block.merkleRoot,
      transactionCount: block.transactionCount,
      gasUsed: block.gasUsed,
      createdAt: block.createdAt,
    };
  }

  async getBlockByHeight(height: bigint): Promise<BlockHeaderData | null> {
    const block = await prisma.block.findUnique({
      where: { height },
    });

    if (!block) return null;

    return {
      height: block.height,
      blockHash: block.blockHash,
      parentHash: block.parentHash,
      merkleRoot: block.merkleRoot,
      transactionCount: block.transactionCount,
      gasUsed: block.gasUsed,
      createdAt: block.createdAt,
    };
  }
}

export const internalNetworkEngine = new InternalNetworkEngine();
