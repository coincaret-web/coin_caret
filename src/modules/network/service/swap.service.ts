import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AccountType, TransactionType, TransactionStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { getWalletAccount, getOrCreateSystemAccount } from "@/modules/ledger/repository/ledger.repository";
import { getFeeForAsset } from "./fee-schedule.service";
import { getRateForPair } from "@/modules/market/service/exchange-rate.service";

export interface SwapQuoteInput {
  fromAmount: Decimal;
  rate: Decimal;
  fee: Decimal;
}

export interface SwapQuoteResult {
  fromAmount: Decimal;
  toAmount: Decimal;
  rate: Decimal;
  fee: Decimal;
  totalDebit: Decimal;
}

export function calculateSwapQuote(input: SwapQuoteInput): SwapQuoteResult {
  const toAmount = input.fromAmount.times(input.rate);
  const totalDebit = input.fromAmount.plus(input.fee);

  return {
    fromAmount: input.fromAmount,
    toAmount,
    rate: input.rate,
    fee: input.fee,
    totalDebit,
  };
}

export function validateSwapInput(input: {
  fromSymbol: string;
  toSymbol: string;
  amount: string | Decimal;
  availableBalance: string | Decimal;
  fee: string | Decimal;
}) {
  const normFrom = input.fromSymbol.trim().toUpperCase();
  const normTo = input.toSymbol.trim().toUpperCase();

  if (normFrom === normTo) {
    throw new Error("Cannot swap between identical assets.");
  }

  const amountDec = new Decimal(input.amount);
  if (amountDec.lte(0)) {
    throw new Error("Swap amount must be strictly greater than zero.");
  }

  const feeDec = new Decimal(input.fee);
  const availableDec = new Decimal(input.availableBalance);
  const totalRequired = amountDec.plus(feeDec);

  if (availableDec.lt(totalRequired)) {
    throw new Error(
      `Insufficient funds for swap and network fee. Required: ${totalRequired.toFixed(8)} ${normFrom}, Available: ${availableDec.toFixed(8)} ${normFrom}.`
    );
  }
}

export async function getSwapQuote(input: {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string | number | Decimal;
}) {
  const normFrom = input.fromSymbol.toUpperCase();
  const normTo = input.toSymbol.toUpperCase();

  const fromAmountDec = new Decimal(input.fromAmount);
  if (fromAmountDec.lte(0)) {
    throw new Error("Swap amount must be strictly greater than zero.");
  }

  const [rateData, feeDec] = await Promise.all([
    getRateForPair(normFrom, normTo),
    getFeeForAsset(normFrom),
  ]);

  const quote = calculateSwapQuote({
    fromAmount: fromAmountDec,
    rate: rateData.rate,
    fee: feeDec,
  });

  return {
    fromSymbol: normFrom,
    toSymbol: normTo,
    rate: rateData.rate.toFixed(8),
    fromAmount: quote.fromAmount.toFixed(8),
    toAmount: quote.toAmount.toFixed(8),
    fee: quote.fee.toFixed(8),
    totalDebit: quote.totalDebit.toFixed(8),
    isCustomAdminRate: rateData.isCustomAdminRate,
  };
}

export async function executeSwap(input: {
  userId: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string | number | Decimal;
  idempotencyKey?: string;
  ipAddress?: string;
}) {
  const normFrom = input.fromSymbol.toUpperCase();
  const normTo = input.toSymbol.toUpperCase();

  if (normFrom === normTo) {
    throw new Error("Cannot swap between identical assets.");
  }

  const fromAmountDec = new Decimal(input.fromAmount);
  if (fromAmountDec.lte(0)) {
    throw new Error("Swap amount must be strictly greater than zero.");
  }

  // 1. Resolve user's wallets for both currencies
  const [sourceWallet, targetWallet] = await Promise.all([
    prisma.wallet.findFirst({
      where: { userId: input.userId, asset: { symbol: normFrom } },
      include: { addresses: true, asset: true },
    }),
    prisma.wallet.findFirst({
      where: { userId: input.userId, asset: { symbol: normTo } },
      include: { addresses: true, asset: true },
    }),
  ]);

  if (!sourceWallet || sourceWallet.isFrozen) {
    throw new Error(`Source wallet for ${normFrom} not found or is frozen.`);
  }
  if (!targetWallet || targetWallet.isFrozen) {
    throw new Error(`Target wallet for ${normTo} not found or is frozen.`);
  }

  // 2. Fetch quote and validate balance
  const quote = await getSwapQuote({
    fromSymbol: normFrom,
    toSymbol: normTo,
    fromAmount: fromAmountDec,
  });

  const sourceBalance = await getWalletBalance(sourceWallet.id);
  validateSwapInput({
    fromSymbol: normFrom,
    toSymbol: normTo,
    amount: fromAmountDec,
    availableBalance: sourceBalance.available,
    fee: quote.fee,
  });

  // 3. Resolve ledger accounts
  const [
    sourceUserAvailable,
    targetUserAvailable,
    sourceFeeAcc,
    sourceTreasuryAcc,
    targetTreasuryAcc,
  ] = await Promise.all([
    getWalletAccount(sourceWallet.id, AccountType.AVAILABLE),
    getWalletAccount(targetWallet.id, AccountType.AVAILABLE),
    getOrCreateSystemAccount(AccountType.SYSTEM_GAS_FEE, sourceWallet.assetId),
    getOrCreateSystemAccount(AccountType.SYSTEM_TREASURY, sourceWallet.assetId),
    getOrCreateSystemAccount(AccountType.SYSTEM_TREASURY, targetWallet.assetId),
  ]);

  if (!sourceUserAvailable || !targetUserAvailable) {
    throw new Error("User ledger accounts not initialized.");
  }

  const sourceTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const targetTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;
  const srcIdempotency = input.idempotencyKey || `swap-src-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  const dstIdempotency = `swap-dst-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  const feeDec = new Decimal(quote.fee);
  const toAmountDec = new Decimal(quote.toAmount);
  const totalDebitDec = new Decimal(quote.totalDebit);

  return prisma.$transaction(async (tx) => {
    // Leg 1: Source Transaction (Debit source asset + fee)
    const sourceTx = await tx.transaction.create({
      data: {
        txHash: sourceTxHash,
        idempotencyKey: srcIdempotency,
        type: TransactionType.SWAP,
        status: TransactionStatus.CONFIRMED,
        assetId: sourceWallet.assetId,
        initiatorUserId: input.userId,
        fromAddress: sourceWallet.addresses[0]?.address ?? "UNKNOWN",
        toAddress: "SWAP_LIQUIDITY_POOL",
        amount: fromAmountDec,
        fee: feeDec,
        totalDebit: totalDebitDec,
        note: `Internal swap: ${fromAmountDec.toFixed(8)} ${normFrom} ➔ ${toAmountDec.toFixed(8)} ${normTo}`,
        confirmations: 3,
      },
    });

    // Leg 2: Target Transaction (Credit target asset to user)
    const targetTx = await tx.transaction.create({
      data: {
        txHash: targetTxHash,
        idempotencyKey: dstIdempotency,
        type: TransactionType.SWAP,
        status: TransactionStatus.CONFIRMED,
        assetId: targetWallet.assetId,
        initiatorUserId: input.userId,
        fromAddress: "SWAP_LIQUIDITY_POOL",
        toAddress: targetWallet.addresses[0]?.address ?? "UNKNOWN",
        amount: toAmountDec,
        fee: new Decimal(0),
        totalDebit: toAmountDec,
        linkedTransactionId: sourceTx.id,
        note: `Settled internal swap: Received ${toAmountDec.toFixed(8)} ${normTo}`,
        confirmations: 3,
      },
    });

    // Update source transaction with linkedTransactionId
    await tx.transaction.update({
      where: { id: sourceTx.id },
      data: { linkedTransactionId: targetTx.id },
    });

    // Post Double-Entry Ledger Entries for Leg 1 (Source Asset)
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: sourceTx.id,
          accountId: sourceUserAvailable.id,
          debit: new Decimal(0),
          credit: totalDebitDec, // Decreases source user balance
        },
        {
          transactionId: sourceTx.id,
          accountId: sourceFeeAcc.id,
          debit: feeDec, // Credits network gas fee pool
          credit: new Decimal(0),
        },
        {
          transactionId: sourceTx.id,
          accountId: sourceTreasuryAcc.id,
          debit: fromAmountDec, // Credits system swap pool
          credit: new Decimal(0),
        },
      ],
    });

    // Post Double-Entry Ledger Entries for Leg 2 (Target Asset)
    await tx.ledgerEntry.createMany({
      data: [
        {
          transactionId: targetTx.id,
          accountId: targetTreasuryAcc.id,
          debit: new Decimal(0),
          credit: toAmountDec, // Decreases system target swap pool
        },
        {
          transactionId: targetTx.id,
          accountId: targetUserAvailable.id,
          debit: toAmountDec, // Increases target user balance
          credit: new Decimal(0),
        },
      ],
    });

    // Transaction Events
    await tx.transactionEvent.createMany({
      data: [
        {
          transactionId: sourceTx.id,
          toStatus: TransactionStatus.CONFIRMED,
          metadata: {
            pair: `${normFrom}/${normTo}`,
            rate: quote.rate,
            fromAmount: fromAmountDec.toString(),
            fee: feeDec.toString(),
          },
        },
        {
          transactionId: targetTx.id,
          toStatus: TransactionStatus.CONFIRMED,
          metadata: {
            pair: `${normFrom}/${normTo}`,
            toAmount: toAmountDec.toString(),
            linkedSourceTxId: sourceTx.id,
          },
        },
      ],
    });

    return {
      success: true,
      sourceTransactionId: sourceTx.id,
      targetTransactionId: targetTx.id,
      fromSymbol: normFrom,
      toSymbol: normTo,
      fromAmount: fromAmountDec.toFixed(8),
      toAmount: toAmountDec.toFixed(8),
      rate: quote.rate,
      fee: feeDec.toFixed(8),
    };
  });
}
