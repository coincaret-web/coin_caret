import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint } from "@/modules/ledger/service/ledger.service";
import { queueTransaction } from "@/modules/network/service/mempool.service";
import { mintNextBlock } from "@/modules/network/service/block.service";
import { GET as getBlocksRoute } from "@/app/api/explorer/blocks/route";
import { GET as getTransactionsRoute } from "@/app/api/explorer/transactions/route";
import { GET as getSearchRoute } from "@/app/api/explorer/search/route";
import { GET as getStatsRoute } from "@/app/api/explorer/stats/route";
import { NextRequest } from "next/server";

describe("Live Block Explorer Integration (W-501)", () => {
  let senderAddress: string;
  let recipientAddress: string;
  let senderWalletId: string;
  let senderUserId: string;

  beforeAll(async () => {
    // 1. Setup Sender User & Wallet
    const sender = await registerUser({
      email: `explorer-sender-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Explorer Sender",
    });
    senderUserId = sender.user.id;
    senderWalletId = sender.wallet.id;
    senderAddress = sender.wallet.address!;

    // 2. Setup Recipient User & Wallet
    const recipient = await registerUser({
      email: `explorer-recip-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Explorer Recipient",
    });
    recipientAddress = recipient.wallet.address!;

    // 3. Fund sender wallet with 5000 CC
    await postTreasuryMint({
      recipientWalletId: senderWalletId,
      amount: "5000.00000000",
      reason: "Explorer Integration Setup",
    });
  });

  it("fetches paginated latest blocks from PostgreSQL via /api/explorer/blocks", async () => {
    // 1. Create a transaction and mint 2 blocks
    await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "100.00000000",
      idempotencyKey: `tx-block-${Date.now()}-${Math.random()}`,
      initiatorUserId: senderUserId,
    });

    const block1 = await mintNextBlock();
    const block2 = await mintNextBlock(); // empty block

    // 2. Call GET /api/explorer/blocks
    const req = new NextRequest("http://127.0.0.1:3847/api/explorer/blocks?limit=10&page=1");
    const res = await getBlocksRoute(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.blocks).toBeDefined();
    expect(data.blocks.length).toBeGreaterThanOrEqual(2);
    const heights = data.blocks.map((b: any) => b.height);
    expect(heights).toContain(block1.height.toString());
    expect(heights).toContain(block2.height.toString());
    expect(data.totalBlocks).toBeGreaterThanOrEqual(2);
  });

  it("fetches latest transactions from PostgreSQL via /api/explorer/transactions", async () => {
    // 1. Create 2 transactions and mint 1 block
    const tx1 = await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "50.00000000",
      idempotencyKey: `tx-list-1-${Date.now()}-${Math.random()}`,
      initiatorUserId: senderUserId,
    });

    await mintNextBlock();

    const tx2 = await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "25.00000000",
      idempotencyKey: `tx-list-2-${Date.now()}-${Math.random()}`,
      initiatorUserId: senderUserId,
    });

    // 2. Call GET /api/explorer/transactions
    const req = new NextRequest("http://127.0.0.1:3847/api/explorer/transactions?limit=10");
    const res = await getTransactionsRoute(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.transactions).toBeDefined();
    expect(data.transactions.length).toBeGreaterThanOrEqual(2);
    const hashes = data.transactions.map((t: any) => t.txHash);
    expect(hashes).toContain(tx1.txHash);
    expect(hashes).toContain(tx2.txHash);
  });

  it("resolves universal search across Tx Hash, Address, Block Height, and Block Hash via /api/explorer/search", async () => {
    // 1. Setup Tx and Block
    const tx = await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "75.00000000",
      idempotencyKey: `tx-search-${Date.now()}-${Math.random()}`,
      initiatorUserId: senderUserId,
    });

    const block = await mintNextBlock();

    // 2. Search by Tx Hash
    const reqTx = new NextRequest(`http://127.0.0.1:3847/api/explorer/search?q=${tx.txHash}`);
    const resTx = await getSearchRoute(reqTx);
    expect(resTx.status).toBe(200);
    const dataTx = await resTx.json();
    expect(dataTx.type).toBe("tx");
    expect(dataTx.target).toBe(tx.txHash);

    // 3. Search by Address
    const reqAddr = new NextRequest(`http://127.0.0.1:3847/api/explorer/search?q=${senderAddress}`);
    const resAddr = await getSearchRoute(reqAddr);
    expect(resAddr.status).toBe(200);
    const dataAddr = await resAddr.json();
    expect(dataAddr.type).toBe("address");
    expect(dataAddr.target).toBe(senderAddress);

    // 4. Search by Block Height
    const reqHeight = new NextRequest(`http://127.0.0.1:3847/api/explorer/search?q=${block.height.toString()}`);
    const resHeight = await getSearchRoute(reqHeight);
    expect(resHeight.status).toBe(200);
    const dataHeight = await resHeight.json();
    expect(dataHeight.type).toBe("block");
    expect(dataHeight.target).toBe(block.height.toString());

    // 5. Search by Block Hash
    const reqBlockHash = new NextRequest(`http://127.0.0.1:3847/api/explorer/search?q=${block.blockHash}`);
    const resBlockHash = await getSearchRoute(reqBlockHash);
    expect(resBlockHash.status).toBe(200);
    const dataBlockHash = await resBlockHash.json();
    expect(dataBlockHash.type).toBe("block");
    expect(dataBlockHash.target).toBe(block.height.toString());

    // 6. Search for non-existent query
    const reqNotFound = new NextRequest(`http://127.0.0.1:3847/api/explorer/search?q=0x9999999999999999999999999999999999999999999999999999999999999999`);
    const resNotFound = await getSearchRoute(reqNotFound);
    expect(resNotFound.status).toBe(404);
  });

  it("calculates live network explorer stats via /api/explorer/stats", async () => {
    await queueTransaction({
      fromWalletId: senderWalletId,
      toAddress: recipientAddress,
      amount: "10.00000000",
      idempotencyKey: `tx-stats-${Date.now()}-${Math.random()}`,
      initiatorUserId: senderUserId,
    });

    await mintNextBlock();

    const req = new NextRequest("http://127.0.0.1:3847/api/explorer/stats");
    const res = await getStatsRoute(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.blockHeight).toBeDefined();
    expect(data.totalTransactions).toBeGreaterThanOrEqual(1);
    expect(data.totalGasUsed).toBeDefined();
    expect(data.blockTimeSeconds).toBe(10);
    expect(data.circulatingSupply).toBeDefined();
  });
});
