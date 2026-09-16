import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint } from "@/modules/ledger/service/ledger.service";

describe("Live Wallet Summary & Ledger Derivation Integration (W-401)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("provisions a user, mints treasury CC, and calculates exact available, reserved, and total balances from live PostgreSQL", async () => {
    const timestamp = Date.now();
    const reg = await registerUser({
      email: `wallet_summary_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Summary Test User",
    });

    const walletId = reg.wallet.id;

    // Mint 500.00000000 CC to wallet
    await postTreasuryMint({
      recipientWalletId: walletId,
      amount: "500.00000000",
      reason: "Initial test funding",
    });

    // Query ledger accounts
    const availableAccount = await prisma.ledgerAccount.findFirst({
      where: { walletId, accountType: "AVAILABLE" },
      include: { entries: true },
    });

    const reservedAccount = await prisma.ledgerAccount.findFirst({
      where: { walletId, accountType: "RESERVED_PENDING" },
      include: { entries: true },
    });

    expect(availableAccount).toBeDefined();
    expect(reservedAccount).toBeDefined();

    let availableSum = 0;
    for (const e of availableAccount!.entries) {
      availableSum += Number(e.debit) - Number(e.credit);
    }

    let reservedSum = 0;
    for (const e of reservedAccount!.entries) {
      reservedSum += Number(e.debit) - Number(e.credit);
    }

    expect(availableSum).toBe(500);
    expect(reservedSum).toBe(0);
    expect(availableSum + reservedSum).toBe(500);
  });
});
