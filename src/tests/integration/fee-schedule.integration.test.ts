import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { queueTransaction } from "@/modules/network/service/mempool.service";
import { registerUser } from "@/modules/identity/service/auth.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";
import { generatePrefixedAddress } from "@/modules/wallets/service/address.service";
import { postTreasuryMint } from "@/modules/ledger/service/ledger.service";

const prisma = new PrismaClient();

describe("Per-Asset Fee Schedule & Asset-Aware Mempool Integration (W-703)", () => {
  let senderUserId: string;
  let senderBtcWalletId: string;
  let btcAssetId: string;

  beforeAll(async () => {
    // 1. Ensure assets exist
    for (const asset of SUPPORTED_ASSETS) {
      await prisma.asset.upsert({
        where: { symbol: asset.symbol },
        update: { isActive: true },
        create: {
          symbol: asset.symbol,
          name: asset.name,
          decimals: asset.decimals,
          type: asset.type,
          isActive: true,
        },
      });
    }

    // 2. Set BTC fee in NetworkSetting table
    await prisma.networkSetting.upsert({
      where: { key: "FEE_BTC" },
      update: { value: "0.000015" },
      create: { key: "FEE_BTC", value: "0.000015", description: "Standard Bitcoin transfer fee" },
    });

    // 3. Register user
    const regResult = await registerUser({
      email: `btcsender-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "BTC Liquidity Provider",
    });

    senderUserId = regResult.user.id;

    // Find BTC wallet
    const btcAsset = await prisma.asset.findUnique({ where: { symbol: "BTC" } });
    btcAssetId = btcAsset!.id;

    const btcWallet = await prisma.wallet.findFirst({
      where: { userId: senderUserId, assetId: btcAssetId },
      include: { addresses: true, ledgerAccounts: true },
    });

    senderBtcWalletId = btcWallet!.id;

    // Mint 0.10000000 BTC using postTreasuryMint
    await postTreasuryMint({
      recipientWalletId: senderBtcWalletId,
      amount: "0.10000000",
      reason: "Initial BTC Liquidity Test",
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should queue BTC transfer with exact BTC fee and atomically reserve funds", async () => {
    const recipientBtcAddress = generatePrefixedAddress("BTC");
    const sendAmount = "0.01000000";

    const tx = await queueTransaction({
      fromWalletId: senderBtcWalletId,
      toAddress: recipientBtcAddress,
      amount: sendAmount,
      idempotencyKey: `btc-send-${Date.now()}`,
      initiatorUserId: senderUserId,
    });

    expect(tx.status).toBe("IN_MEMPOOL");
    expect(tx.fee.toFixed(8)).toBe("0.00001500");
    expect(tx.totalDebit.toFixed(8)).toBe("0.01001500");
    expect(tx.assetId).toBe(btcAssetId);
  });

  it("should reject transfer when BTC balance is insufficient for amount + BTC fee", async () => {
    const recipientBtcAddress = generatePrefixedAddress("BTC");
    // Attempting to send 10 BTC when user has 0.1 BTC
    await expect(
      queueTransaction({
        fromWalletId: senderBtcWalletId,
        toAddress: recipientBtcAddress,
        amount: "10.00000000",
        idempotencyKey: `btc-overdraft-${Date.now()}`,
        initiatorUserId: senderUserId,
      })
    ).rejects.toThrow(/Insufficient available balance/i);
  });
});
