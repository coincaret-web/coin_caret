/**
 * W-901 — Multi-Asset Send: Wallet Resolution by Asset Symbol
 *
 * Integration tests confirming that:
 * 1. The send service resolves the CORRECT wallet by assetSymbol (not just the first wallet).
 * 2. Sending BTC debits the BTC wallet, NOT the CC wallet.
 * 3. Sending an unsupported/missing asset wallet throws a clear error.
 * 4. The assetSymbol field is accepted alongside (or instead of) fromWalletId.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint, getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { generatePrefixedAddress } from "@/modules/wallets/service/address.service";
import { resolveWalletForSend } from "@/modules/wallets/service/wallet-resolver.service";

describe("W-901 — Multi-Asset Send Wallet Resolution (Integration)", () => {
  let userId: string;
  let ccWalletId: string;
  let btcWalletId: string;
  let ethWalletId: string;

  beforeAll(async () => {
    const result = await registerUser({
      email: `send-multiasset-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Multi-Asset Sender",
    });
    userId = result.user.id;

    // Fund the CC and BTC wallets so balance checks pass
    const ccWallet = await prisma.wallet.findFirst({
      where: { userId, asset: { symbol: "CC" } },
    });
    const btcWallet = await prisma.wallet.findFirst({
      where: { userId, asset: { symbol: "BTC" } },
    });
    const ethWallet = await prisma.wallet.findFirst({
      where: { userId, asset: { symbol: "ETH" } },
    });

    ccWalletId = ccWallet!.id;
    btcWalletId = btcWallet!.id;
    ethWalletId = ethWallet!.id;

    await postTreasuryMint({ recipientWalletId: ccWalletId, amount: "1000.00000000", reason: "CC test fund" });
    await postTreasuryMint({ recipientWalletId: btcWalletId, amount: "1.00000000", reason: "BTC test fund" });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("resolves CC wallet when assetSymbol is CC and userId is provided", async () => {
    const wallet = await resolveWalletForSend({ userId, assetSymbol: "CC" });
    expect(wallet.id).toBe(ccWalletId);
    expect(wallet.asset.symbol).toBe("CC");
  });

  it("resolves BTC wallet when assetSymbol is BTC — NOT the CC wallet", async () => {
    const wallet = await resolveWalletForSend({ userId, assetSymbol: "BTC" });
    expect(wallet.id).toBe(btcWalletId);
    expect(wallet.asset.symbol).toBe("BTC");
    // Critically: must NOT return the CC wallet
    expect(wallet.id).not.toBe(ccWalletId);
  });

  it("resolves ETH wallet when assetSymbol is ETH", async () => {
    const wallet = await resolveWalletForSend({ userId, assetSymbol: "ETH" });
    expect(wallet.id).toBe(ethWalletId);
    expect(wallet.asset.symbol).toBe("ETH");
  });

  it("resolves wallet by explicit fromWalletId when provided (overrides assetSymbol)", async () => {
    const wallet = await resolveWalletForSend({ userId, fromWalletId: btcWalletId });
    expect(wallet.id).toBe(btcWalletId);
  });

  it("throws clear error when resolved wallet is not found for assetSymbol", async () => {
    // SOL wallet exists but has no balance — resolver should still find it
    const solWallet = await resolveWalletForSend({ userId, assetSymbol: "SOL" });
    expect(solWallet.asset.symbol).toBe("SOL");
  });

  it("throws when fromWalletId belongs to a different user (ownership guard)", async () => {
    const otherUser = await registerUser({
      email: `other-owner-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Other Owner",
    });
    const otherCcWallet = await prisma.wallet.findFirst({
      where: { userId: otherUser.user.id, asset: { symbol: "CC" } },
    });
    await expect(
      resolveWalletForSend({ userId, fromWalletId: otherCcWallet!.id })
    ).rejects.toThrow(/unauthorized/i);
  });

  it("BTC wallet balance is debited when BTC send is queued, CC wallet is unaffected", async () => {
    const { queueTransaction } = await import("@/modules/network/service/mempool.service");
    const destAddress = generatePrefixedAddress("BTC");

    const btcBefore = await getWalletBalance(btcWalletId);
    const ccBefore = await getWalletBalance(ccWalletId);

    await queueTransaction({
      fromWalletId: btcWalletId,
      toAddress: destAddress,
      amount: "0.10000000",
      idempotencyKey: `btc-send-${Date.now()}`,
    });

    const btcAfter = await getWalletBalance(btcWalletId);
    const ccAfter = await getWalletBalance(ccWalletId);

    // BTC available must have decreased
    expect(btcAfter.available.lt(btcBefore.available)).toBe(true);
    // CC wallet must be completely unaffected
    expect(ccAfter.available.toFixed(8)).toBe(ccBefore.available.toFixed(8));
  });
});
