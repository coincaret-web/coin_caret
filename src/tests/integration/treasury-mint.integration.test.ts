import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { POST } from "@/app/api/admin/treasury/mint/route";
import { NextRequest } from "next/server";

describe("Admin Treasury Minting & Audit Integration (W-602)", () => {
  let adminUserId: string;
  let regularUserId: string;
  let targetWalletId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 1. Setup Roles
    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const timestamp = Date.now();
    // 2. Register Admin User
    const adminReg = await registerUser({
      email: `admin_treasury_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Treasury Admin",
    });
    adminUserId = adminReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: adminUserId } });
    await prisma.userRole.create({ data: { userId: adminUserId, roleId: ownerRole.id } });

    // 3. Register Regular User to receive issuance
    const userReg = await registerUser({
      email: `client_recipient_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Client Demo Recipient",
    });
    regularUserId = userReg.user.id;
    targetWalletId = userReg.wallet.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allows PLATFORM_OWNER to mint CC to target wallet, updates zero-sum ledger, and creates AuditLog", async () => {
    const initialBalance = await getWalletBalance(targetWalletId);
    expect(Number(initialBalance.available)).toBe(0);

    const mintPayload = {
      recipientWalletId: targetWalletId,
      amount: "10000.00000000",
      reason: "Client Demo Onboarding Allocation",
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/treasury/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify(mintPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.transactionId).toBeDefined();

    // Verify balance in PostgreSQL ledger
    const updatedBalance = await getWalletBalance(targetWalletId);
    expect(Number(updatedBalance.available)).toBe(10000);

    // Verify AuditLog in DB
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "TREASURY_MINT",
        actorUserId: adminUserId,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit?.entityType).toBe("TREASURY_MINT");
    expect((audit?.afterState as any)?.amount).toBe("10000.00000000");
  });

  it("rejects unauthorized USER from minting treasury CC with HTTP 403 Forbidden", async () => {
    const mintPayload = {
      recipientWalletId: targetWalletId,
      amount: "500.00000000",
      reason: "Unauthorized attempt",
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/treasury/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": regularUserId,
      },
      body: JSON.stringify(mintPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("rejects non-positive amounts with HTTP 400 Bad Request", async () => {
    const invalidPayload = {
      recipientWalletId: targetWalletId,
      amount: "-100.00000000",
      reason: "Negative amount test",
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/treasury/mint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify(invalidPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
