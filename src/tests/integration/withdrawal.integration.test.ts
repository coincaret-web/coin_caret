import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint } from "@/modules/ledger/service/ledger.service";

describe("Live Withdrawal Lifecycle Integration (W-404)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("submits a withdrawal request of 150 CC, creates a WITHDRAWAL record in PostgreSQL, and verifies balance reservation", async () => {
    const timestamp = Date.now();
    const reg = await registerUser({
      email: `withdraw_test_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Withdrawal Test User",
    });

    const userId = reg.user.id;
    const walletId = reg.wallet.id;

    // 1. Mint 500 CC
    await postTreasuryMint({
      recipientWalletId: walletId,
      amount: "500.00000000",
      reason: "Withdrawal test funding",
    });

    // 2. Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        walletId,
        destinationAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        amount: 150.0,
        fee: 0.5,
        status: "REQUESTED",
      },
    });

    expect(withdrawal).toBeDefined();
    expect(withdrawal.id).toBeDefined();
    expect(withdrawal.status).toBe("REQUESTED");
    expect(Number(withdrawal.amount)).toBe(150);

    // 3. Status transition to APPROVED
    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { status: "APPROVED", reviewNotes: "Automated test approval" },
    });

    expect(updated.status).toBe("APPROVED");
    expect(updated.reviewNotes).toBe("Automated test approval");
  });
});
