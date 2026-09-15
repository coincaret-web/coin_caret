import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint, getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { queueTransaction } from "@/modules/network/service/mempool.service";
import { mintNextBlock } from "@/modules/network/service/block.service";
import { advanceConfirmations } from "@/modules/network/service/confirmation.service";
import { TransactionStatus } from "@prisma/client";

describe("Live Double-Entry Ledger & Block Engine Database Integration (W-104, W-202, W-203, W-204)", () => {
  let senderWalletId: string;
  let senderAddress: string;
  let recipientWalletId: string;
  let recipientAddress: string;

  beforeAll(async () => {
    // 1. Register Sender
    const sender = await registerUser({
      email: `sender-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Sender User",
    });
    senderWalletId = sender.wallet.id;
    senderAddress = sender.wallet.address!;

    // 2. Register Recipient
    const recipient = await registerUser({
      email: `recipient-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Recipient User",
    });
    recipientWalletId = recipient.wallet.id;
    recipientAddress = recipient.wallet.address!;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("mints 1,000 CC to sender wallet and verifies derived double-entry balance in PostgreSQL", async () => {
    const mintTx = await postTreasuryMint({
      recipientWalletId: senderWalletId,
      amount: "1000.00000000",
      reason: "Initial Treasury Allocation",
    });

    expect(mintTx.id).toBeDefined();
    expect(mintTx.status).toBe(TransactionStatus.CONFIRMED);

    // Verify ledger balance derived from database entries
    const balance = await getWalletBalance(senderWalletId);
    expect(balance.available.toFixed(8)).toBe("1000.00000000");
    expect(balance.reserved.toFixed(8)).toBe("0.00000000");
    expect(balance.total.toFixed(8)).toBe("1000.00000000");
  });

  it("queues a transfer of 100 CC with 0.50 CC gas fee and atomically locks funds in RESERVED_PENDING", async () => {
    const idempotencyKey = `transfer-${Date.now()}`;

    const tx = await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "100.00000000",
      note: "Integration Test Send",
      idempotencyKey,
    });

    expect(tx.status).toBe(TransactionStatus.IN_MEMPOOL);
    expect(tx.amount.toFixed(8)).toBe("100.00000000");
    expect(tx.fee.toFixed(8)).toBe("0.50000000");
    expect(tx.totalDebit.toFixed(8)).toBe("100.50000000");

    // Verify sender balance in DB: Available should decrease by 100.50, Reserved should increase by 100.50
    const senderBalance = await getWalletBalance(senderWalletId);
    expect(senderBalance.available.toFixed(8)).toBe("899.50000000");
    expect(senderBalance.reserved.toFixed(8)).toBe("100.50000000");
    expect(senderBalance.total.toFixed(8)).toBe("1000.00000000"); // Total remains constant until settled
  });

  it("prevents double-spending if sender attempts to spend more than available balance", async () => {
    // Sender has 899.50 available. Attempting to send 900.00 (+0.50 fee = 900.50) must fail
    await expect(
      queueTransaction({
        fromWalletId: senderWalletId,
        toAddress: recipientAddress,
        amount: "900.00000000",
        idempotencyKey: `double-spend-${Date.now()}`,
      })
    ).rejects.toThrow("Insufficient available balance");
  });

  it("mints the next block, seals the transaction, and advances confirmations to terminal settlement", async () => {
    // 1. Mint Block #1 packaging the mempool transaction
    const block = await mintNextBlock();
    expect(block.height).toBeGreaterThanOrEqual(1n);
    expect(block.transactionCount).toBeGreaterThanOrEqual(1);
    expect(block.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/);

    // 2. Advance confirmations (Stage 2/3 and Stage 3/3 Final Settlement)
    await advanceConfirmations(3);
    await advanceConfirmations(3);

    // 3. Verify final ledger balances in PostgreSQL
    const senderFinalBalance = await getWalletBalance(senderWalletId);
    expect(senderFinalBalance.available.toFixed(8)).toBe("899.50000000");
    expect(senderFinalBalance.reserved.toFixed(8)).toBe("0.00000000"); // Reserved released
    expect(senderFinalBalance.total.toFixed(8)).toBe("899.50000000");

    const recipientFinalBalance = await getWalletBalance(recipientWalletId);
    expect(recipientFinalBalance.available.toFixed(8)).toBe("100.00000000"); // Credited to available
    expect(recipientFinalBalance.total.toFixed(8)).toBe("100.00000000");
  });
});
