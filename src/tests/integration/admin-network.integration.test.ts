import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { GET, PATCH } from "@/app/api/admin/network/route";
import { NextRequest } from "next/server";

describe("Admin Network Controls & RBAC Integration (W-601)", () => {
  let ownerUserId: string;
  let standardUserId: string;
  let financeUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 1. Ensure Roles exist
    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const financeRole = await prisma.role.upsert({
      where: { name: "FINANCE_OPERATOR" },
      update: {},
      create: { name: "FINANCE_OPERATOR", description: "Finance Operator" },
    });

    const userRole = await prisma.role.upsert({
      where: { name: "USER" },
      update: {},
      create: { name: "USER", description: "Standard User" },
    });

    // 2. Register Owner User
    const timestamp = Date.now();
    const ownerReg = await registerUser({
      email: `owner_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Platform Owner",
    });
    ownerUserId = ownerReg.user.id;
    // Assign PLATFORM_OWNER role
    await prisma.userRole.deleteMany({ where: { userId: ownerUserId } });
    await prisma.userRole.create({ data: { userId: ownerUserId, roleId: ownerRole.id } });

    // 3. Register Standard User
    const standardReg = await registerUser({
      email: `user_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Standard User",
    });
    standardUserId = standardReg.user.id;

    // 4. Register Finance Operator
    const financeReg = await registerUser({
      email: `finance_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Finance Operator",
    });
    financeUserId = financeReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: financeUserId } });
    await prisma.userRole.create({ data: { userId: financeUserId, roleId: financeRole.id } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("fetches network settings defaults when requested", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/network");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.settings).toBeDefined();
    expect(body.settings.blockIntervalMs).toBeDefined();
    expect(body.settings.standardFeeCc).toBeDefined();
    expect(body.settings.isNetworkPaused).toBeDefined();
  });

  it("allows PLATFORM_OWNER to update network configuration and writes AuditLog", async () => {
    const patchBody = {
      blockIntervalMs: 5000,
      standardFeeCc: "0.25000000",
      isNetworkPaused: false,
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/network", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId, // Simulated authenticated context
      },
      body: JSON.stringify(patchBody),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.settings.blockIntervalMs).toBe(5000);
    expect(body.settings.standardFeeCc).toBe("0.25000000");
    expect(body.settings.isNetworkPaused).toBe(false);

    // Verify AuditLog in DB
    const audit = await prisma.auditLog.findFirst({
      where: {
        action: "UPDATE_NETWORK_CONFIG",
        actorUserId: ownerUserId,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).not.toBeNull();
    expect(audit?.entityType).toBe("NETWORK_SETTING");
  });

  it("rejects non-admin USER with HTTP 403 Forbidden", async () => {
    const patchBody = {
      blockIntervalMs: 8000,
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/network", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": standardUserId,
      },
      body: JSON.stringify(patchBody),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/Forbidden|insufficient permissions/i);
  });

  it("rejects FINANCE_OPERATOR from modifying network config with HTTP 403 Forbidden", async () => {
    const patchBody = {
      blockIntervalMs: 8000,
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/network", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": financeUserId,
      },
      body: JSON.stringify(patchBody),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it("validates input and rejects invalid parameter bounds with HTTP 400", async () => {
    const invalidBody = {
      blockIntervalMs: 500, // Too small (minimum 1000ms)
    };

    const req = new NextRequest("http://127.0.0.1:3847/api/admin/network", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify(invalidBody),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
