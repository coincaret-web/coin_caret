import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint } from "@/modules/ledger/service/ledger.service";
import { queueTransaction } from "@/modules/network/service/mempool.service";
import { mintNextBlock } from "@/modules/network/service/block.service";
import { advanceConfirmations } from "@/modules/network/service/confirmation.service";
import { GET as getTxDetailsRoute } from "@/app/api/explorer/tx/[hash]/route";
import { GET as getBlockDetailsRoute } from "@/app/api/explorer/block/[height]/route";
import { GET as getAddressDetailsRoute } from "@/app/api/explorer/address/[address]/route";
import { NextRequest } from "next/server";

describe("Live Granular Explorer Inspector Integration (W-502)", () => {
  let senderAddress: string;
  let recipientAddress: string;
  let senderWalletId: string;
  let senderUserId: string;
  let sampleTxHash: string;
  let sampleBlockHeight: string;

  beforeAll(async () => {
    // 1. Setup Sender & Recipient
    const sender = await registerUser({
      email: `inspector-sender-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Inspector Sender",
    });
    senderUserId = sender.user.id;
    senderWalletId = sender.wallet.id;
    senderAddress = sender.wallet.address!;

    const recipient = await registerUser({
      email: `inspector-recip-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Inspector Recipient",
    });
    recipientAddress = recipient.wallet.address!;

    // 2. Fund sender with 3000 CC
    await postTreasuryMint({
      recipientWalletId: senderWalletId,
      amount: "3000.00000000",
      reason: "Inspector Setup",
    });

    // 3. Queue a transaction
    const tx = await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "150.00000000",
      note: "Inspector Test Transfer",
      idempotencyKey: `inspect-tx-${Date.now()}`,
      initiatorUserId: senderUserId,
    });
    sampleTxHash = tx.txHash;

    // 4. Mint block
    const block = await mintNextBlock();
    sampleBlockHeight = block.height.toString();

    // 5. Advance confirmations to 3
    await advanceConfirmations();
    await advanceConfirmations();
  });

  it("fetches full transaction cryptographic details via /api/explorer/tx/[hash]", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/explorer/tx/${sampleTxHash}`);
    const res = await getTxDetailsRoute(req, { params: { hash: sampleTxHash } });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.txHash).toBe(sampleTxHash);
    expect(data.fromAddress).toBe(senderAddress);
    expect(data.toAddress).toBe(recipientAddress);
    expect(data.amount).toBe("150.00000000");
    expect(data.fee).toBe("0.50000000");
    expect(data.totalDebit).toBe("150.50000000");
    expect(data.blockHeight).toBe(sampleBlockHeight);
    expect(data.confirmations).toBeGreaterThanOrEqual(3);
    expect(data.status).toBe("CONFIRMED");
    expect(data.note).toBe("Inspector Test Transfer");
    expect(data.events).toBeDefined();
    expect(data.events.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for non-existent transaction hash", async () => {
    const fakeHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const req = new NextRequest(`http://127.0.0.1:3847/api/explorer/tx/${fakeHash}`);
    const res = await getTxDetailsRoute(req, { params: { hash: fakeHash } });

    expect(res.status).toBe(404);
  });

  it("fetches block details with parent hash, Merkle root, and tx list via /api/explorer/block/[height]", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/explorer/block/${sampleBlockHeight}`);
    const res = await getBlockDetailsRoute(req, { params: { height: sampleBlockHeight } });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.height).toBe(sampleBlockHeight);
    expect(data.blockHash).toMatch(/^0x[a-f0-9]{64}$/i);
    expect(data.parentHash).toMatch(/^0x[a-f0-9]{64}$/i);
    expect(data.merkleRoot).toMatch(/^0x[a-f0-9]{64}$/i);
    expect(data.transactionCount).toBeGreaterThanOrEqual(1);
    expect(data.gasUsed).toBeDefined();
    expect(data.status).toBe("SEALED");
    expect(data.blockTransactions).toBeDefined();
    expect(data.blockTransactions.length).toBeGreaterThanOrEqual(1);
    expect(data.blockTransactions[0].transaction.txHash).toBe(sampleTxHash);
  });

  it("returns 404 for non-existent block height", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/explorer/block/999999999");
    const res = await getBlockDetailsRoute(req, { params: { height: "999999999" } });

    expect(res.status).toBe(404);
  });

  it("fetches address details with derived balances and transaction history via /api/explorer/address/[address]", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/explorer/address/${recipientAddress}`);
    const res = await getAddressDetailsRoute(req, { params: { address: recipientAddress } });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.address).toBe(recipientAddress);
    expect(data.isValidChecksum).toBe(true);
    expect(data.displayName).toBe("Inspector Recipient");
    expect(data.balances.available).toBe("150.00000000");
    expect(data.balances.total).toBe("150.00000000");
    expect(data.metrics.totalReceived).toBe("150.00000000");
    expect(data.transactions).toBeDefined();
    expect(data.transactions.length).toBeGreaterThanOrEqual(1);
    expect(data.transactions[0].txHash).toBe(sampleTxHash);
  });
});
