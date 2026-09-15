import { Decimal } from "@prisma/client/runtime/library";

export interface FeeSchedule {
  assetSymbol: string;
  standardFee: Decimal;
  blockIntervalMs: number;
  requiredConfirmations: number;
}

export interface BroadcastTransactionInput {
  fromWalletId: string;
  toAddress: string;
  amount: Decimal | number | string;
  note?: string;
  idempotencyKey: string;
  initiatorUserId?: string;
}

export interface BroadcastTransactionResult {
  txHash: string;
  status: string;
  fee: Decimal;
  amount: Decimal;
  totalDebit: Decimal;
  fromAddress: string;
  toAddress: string;
}

export interface BlockHeaderData {
  height: bigint;
  blockHash: string;
  parentHash: string;
  merkleRoot: string;
  transactionCount: number;
  gasUsed: Decimal;
  createdAt: Date;
}

export interface INetworkEngine {
  getFeeSchedule(): Promise<FeeSchedule>;
  broadcastTx(input: BroadcastTransactionInput): Promise<BroadcastTransactionResult>;
  getLatestBlock(): Promise<BlockHeaderData | null>;
  getBlockByHeight(height: bigint): Promise<BlockHeaderData | null>;
}
