import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "@/modules/identity/service/auth.service";
import { executeTreasuryMint } from "@/modules/admin/service/treasury.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";

const prisma = new PrismaClient();

describe("Multi-Asset Admin Treasury Minting & Audit Integration (W-704)", () => {
  let adminUserId: string;
  let clientUserId: string;
  let clientBtcWalletId: string;
  let clientEthWalletId: string;

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

    // 2. Register admin and client user
    const admin = await registerUser({
      email: `treasuryadmin-${Date.now()}@coincaret.com`,
      password: "AdminPassword123!",
      displayName: "Sovereign Mint Master",
    });
    adminUserId = admin.user.id;

    const client = await registerUser({
      email: `treasuryclient-${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Institutional Client",
    });
    clientUserId = client.user.id;

    const btcAsset = await prisma.asset.findUnique({ where: { symbol: "BTC" } });
    const ethAsset = await prisma.asset.findUnique({ where: { symbol: "ETH" } });

    const btcWallet = await prisma.wallet.findFirst({
      where: { userId: clientUserId, assetId: btcAsset!.id },
    });
    const ethWallet = await prisma.wallet.findFirst({
      where: { userId: clientUserId, assetId: ethAsset!.id },
    });

    clientBtcWalletId = btcWallet!.id;
    clientEthWalletId = ethWallet!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should mint BTC directly to client BTC wallet and record asset in AuditLog", async () => {
    const mintAmount = "0.25000000";
    const result = await executeTreasuryMint({
      recipientWalletId: clientBtcWalletId,
      amount: mintAmount,
      reason: "Institutional Bitcoin Liquidity Grant",
      actorUserId: adminUserId,
      assetSymbol: "BTC",
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(mintAmount);

    // Verify wallet balance derived
    const balance = await getWalletBalance(clientBtcWalletId);
    expect(balance.available.toFixed(8)).toBe(mintAmount);

    // Verify AuditLog
    const audit = await prisma.auditLog.findFirst({
      where: { action: "TREASURY_MINT", entityId: result.issuanceId },
    });

    expect(audit).toBeDefined();
    const after = audit?.afterState as any;
    expect(after?.assetSymbol).toBe("BTC");
    expect(after?.amount).toBe(mintAmount);
  });

  it("should mint ETH directly to client ETH wallet", async () => {
    const mintAmount = "5.00000000";
    const result = await executeTreasuryMint({
      recipientWalletId: clientEthWalletId,
      amount: mintAmount,
      reason: "Ethereum Liquidity Allocation",
      actorUserId: adminUserId,
      assetSymbol: "ETH",
    });

    expect(result.success).toBe(true);
    const balance = await getWalletBalance(clientEthWalletId);
    expect(balance.available.toFixed(8)).toBe(mintAmount);
  });

  it("should reject minting when assetSymbol mismatches the target wallet asset", async () => {
    await expect(
      executeTreasuryMint({
        recipientWalletId: clientBtcWalletId,
        amount: "1.00000000",
        reason: "Asset mismatch test",
        actorUserId: adminUserId,
        assetSymbol: "ETH", // Sending ETH to BTC wallet
      })
    ).rejects.toThrow(/mismatch/i);
  });
});
