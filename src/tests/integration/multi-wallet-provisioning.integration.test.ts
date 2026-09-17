import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "@/modules/identity/service/auth.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const prisma = new PrismaClient();

describe("Multi-Asset Wallet Provisioning Integration (W-702)", () => {
  const testEmail = `multiwallet-${Date.now()}@coincaret.com`;

  beforeAll(async () => {
    // Ensure all 8 assets exist
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should provision exactly 8 wallets and 16 ledger accounts upon user registration", async () => {
    const result = await registerUser({
      email: testEmail,
      password: "TestPassword123!",
      displayName: "Multi-Asset Venture Capital",
    });

    const userId = result.user.id;

    // Check 8 wallets created
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      include: {
        asset: true,
        addresses: true,
        ledgerAccounts: true,
      },
    });

    expect(wallets.length).toBe(8);

    const assetSymbols = wallets.map((w) => w.asset.symbol);
    const expected = ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"];
    for (const exp of expected) {
      expect(assetSymbols).toContain(exp);
    }

    // Verify each wallet has prefixed address and 2 ledger accounts
    let totalLedgerAccounts = 0;
    for (const w of wallets) {
      expect(w.addresses.length).toBe(1);
      const addr = w.addresses[0].address;
      expect(addr.startsWith(`${w.asset.symbol}0x`)).toBe(true);

      expect(w.ledgerAccounts.length).toBe(2);
      const types = w.ledgerAccounts.map((a) => a.accountType);
      expect(types).toContain("AVAILABLE");
      expect(types).toContain("RESERVED_PENDING");

      totalLedgerAccounts += w.ledgerAccounts.length;
    }

    expect(totalLedgerAccounts).toBe(16);
  });

  it("should lazily provision missing wallets when ensureAllWalletsForUser is called for a single-wallet user", async () => {
    const { ensureAllWalletsForUser } = await import("@/modules/wallets/service/wallet.service");
    
    // Create a user with only 1 CC wallet
    const legacyEmail = `legacy-user-${Date.now()}@coincaret.com`;
    const ccAsset = await prisma.asset.findUnique({ where: { symbol: "CC" } });
    const { provisionWallet } = await import("@/modules/wallets/repository/wallet.repository");
    const user = await prisma.user.create({
      data: {
        email: legacyEmail,
        passwordHash: "hashed",
        displayName: "Legacy User",
      },
    });

    const { generatePrefixedAddress } = await import("@/modules/wallets/service/address.service");
    await provisionWallet(user.id, generatePrefixedAddress("CC"), ccAsset!.id, "Primary CC Wallet");

    const initialWallets = await prisma.wallet.findMany({ where: { userId: user.id } });
    expect(initialWallets.length).toBe(1);

    // Call ensureAllWalletsForUser
    const updatedWallets = await ensureAllWalletsForUser(user.id);
    expect(updatedWallets.length).toBe(8);

    const symbols = updatedWallets.map((w) => w.asset?.symbol);
    for (const sym of ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"]) {
      expect(symbols).toContain(sym);
    }
  });
});

