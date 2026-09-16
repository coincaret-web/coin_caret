import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { postTreasuryMint, getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { queueTransaction } from "@/modules/network/service/mempool.service";
import { generateAddress } from "@/modules/wallets/service/address.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Comprehensive Edge Cases & Security Invariants (Integration)", () => {
  it("enforces case-insensitive email uniqueness and prevents duplicate accounts", async () => {
    const email = `case.test.${Date.now()}@coincaret.com`;
    const user1 = await registerUser({
      email: email.toLowerCase(),
      password: "Password123!",
      displayName: "Case Sensitive User",
    });

    expect(user1.user.email).toBe(email.toLowerCase());

    // Attempt duplicate registration with uppercase email
    await expect(
      registerUser({
        email: email.toUpperCase(),
        password: "Password123!",
        displayName: "Duplicate Attempt",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects self-transfers (sending to one's own wallet address)", async () => {
    const user = await registerUser({
      email: `selftx.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Self Sender",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
      include: { addresses: true },
    });

    const ownAddress = wallet!.addresses[0].address;

    // Fund wallet
    await postTreasuryMint({
      recipientWalletId: wallet!.id,
      amount: "100.00000000",
      reason: "Self-transfer test funding",
    });

    // Attempt transfer to own address
    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: ownAddress,
        amount: "10.00000000",
        idempotencyKey: `self-tx-${Date.now()}`,
      })
    ).rejects.toThrow(/Self-transfers to the same wallet address are not permitted/i);
  });

  it("rejects transfers with invalid recipient checksums or formats", async () => {
    const user = await registerUser({
      email: `invalidaddr.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Invalid Address Tester",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
    });

    await postTreasuryMint({
      recipientWalletId: wallet!.id,
      amount: "50.00000000",
      reason: "Invalid address test funding",
    });

    // 1. Missing prefix
    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: "0x1234567890123456789012345678901234567890",
        amount: "10.00000000",
        idempotencyKey: `inv-addr-1-${Date.now()}`,
      })
    ).rejects.toThrow(/Invalid destination wallet address/i);

    // 2. Non-hex characters
    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: "CC0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
        amount: "10.00000000",
        idempotencyKey: `inv-addr-2-${Date.now()}`,
      })
    ).rejects.toThrow(/Invalid destination wallet address/i);
  });

  it("rejects zero and negative transfer amounts", async () => {
    const user = await registerUser({
      email: `negamt.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Negative Amount Tester",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
    });

    const destAddress = generateAddress();

    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: destAddress,
        amount: "0.00000000",
        idempotencyKey: `neg-1-${Date.now()}`,
      })
    ).rejects.toThrow(/strictly greater than zero/i);

    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: destAddress,
        amount: "-10.00000000",
        idempotencyKey: `neg-2-${Date.now()}`,
      })
    ).rejects.toThrow(/strictly greater than zero/i);
  });

  it("rejects transfer when balance is insufficient by even 0.00000001 CC", async () => {
    const user = await registerUser({
      email: `insufficient.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Insufficient Balance Tester",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
    });

    // Fund with exactly 10.00000000 CC
    await postTreasuryMint({
      recipientWalletId: wallet!.id,
      amount: "10.00000000",
      reason: "Precision boundary test",
    });

    const destAddress = generateAddress();

    // Standard fee is 0.50 CC.
    // Max sendable is 9.50000000 CC.
    // Try sending 9.50000001 CC (Total required: 10.00000001 CC > 10.00000000 CC)
    await expect(
      queueTransaction({
        fromWalletId: wallet!.id,
        toAddress: destAddress,
        amount: "9.50000001",
        idempotencyKey: `insuf-${Date.now()}`,
      })
    ).rejects.toThrow(/Insufficient available balance/i);
  });

  it("allows sending the exact maximum available balance (Available - Gas Fee)", async () => {
    const user = await registerUser({
      email: `maxsend.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Max Send Tester",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
    });

    // Fund with exactly 10.00000000 CC
    await postTreasuryMint({
      recipientWalletId: wallet!.id,
      amount: "10.00000000",
      reason: "Max send test",
    });

    const destAddress = generateAddress();

    // Max sendable amount: 10.00 - 0.50 = 9.50 CC
    const tx = await queueTransaction({
      fromWalletId: wallet!.id,
      toAddress: destAddress,
      amount: "9.50000000",
      idempotencyKey: `max-send-${Date.now()}`,
    });

    expect(tx.status).toBe("IN_MEMPOOL");

    // Balance verification: Available must be exactly 0.00000000 CC, Reserved must be 10.00000000 CC
    const balance = await getWalletBalance(wallet!.id);
    expect(balance.available.toFixed(8)).toBe("0.00000000");
    expect(balance.reserved.toFixed(8)).toBe("10.00000000");
    expect(balance.total.toFixed(8)).toBe("10.00000000");
  });

  it("guarantees transaction idempotency (replaying identical idempotency key does not double-spend)", async () => {
    const user = await registerUser({
      email: `idempotent.${Date.now()}@coincaret.com`,
      password: "Password123!",
      displayName: "Idempotent User",
    });

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.user.id },
    });

    await postTreasuryMint({
      recipientWalletId: wallet!.id,
      amount: "100.00000000",
      reason: "Idempotency test funding",
    });

    const destAddress = generateAddress();
    const idempotencyKey = `idem-key-${Date.now()}`;

    // First broadcast
    const tx1 = await queueTransaction({
      fromWalletId: wallet!.id,
      toAddress: destAddress,
      amount: "20.00000000",
      idempotencyKey,
    });

    // Second broadcast with exact same key
    const tx2 = await queueTransaction({
      fromWalletId: wallet!.id,
      toAddress: destAddress,
      amount: "20.00000000",
      idempotencyKey,
    });

    expect(tx1.id).toBe(tx2.id);
    expect(tx1.txHash).toBe(tx2.txHash);

    // Verify balance was only reserved once (100 - 20.50 = 79.50 available)
    const balance = await getWalletBalance(wallet!.id);
    expect(balance.available.toFixed(8)).toBe("79.50000000");
    expect(balance.reserved.toFixed(8)).toBe("20.50000000");
  });
});
