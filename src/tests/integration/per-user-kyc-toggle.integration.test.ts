import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { kycGateService } from "@/modules/kyc/service/kyc-gate.service";
import { PATCH as toggleKyc } from "@/app/api/admin/users/[userId]/kyc-toggle/route";
import { NextRequest } from "next/server";

describe("W-904: Per-User KYC Override Toggle Integration Tests", () => {
  const timestamp = Date.now();
  let ownerUserId: string;
  let targetUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const ownerReg = await registerUser({
      email: `kyc_toggle_owner_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Toggle Owner",
      phoneNumber: "+1-555-019-8888",
      address: "100 Sovereign Plaza, Austin, TX",
    });
    ownerUserId = ownerReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: ownerUserId } });
    await prisma.userRole.create({ data: { userId: ownerUserId, roleId: ownerRole.id } });

    const targetReg = await registerUser({
      email: `kyc_toggle_target_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Toggle Target User",
      phoneNumber: "+1-555-019-7777",
      address: "200 Target Ave, Austin, TX",
    });
    targetUserId = targetReg.user.id;

    const regularReg = await registerUser({
      email: `kyc_toggle_regular_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Regular User",
      phoneNumber: "+1-555-019-6666",
      address: "300 Regular St, Austin, TX",
    });
    regularUserId = regularReg.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Test 1: PATCH /api/admin/users/[userId]/kyc-toggle with { kycRequired: false } as Platform Owner updates DB to false and returns 200", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ kycRequired: false }),
    });

    const res = await toggleKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.userId).toBe(targetUserId);
    expect(data.kycRequired).toBe(false);

    const userInDb = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    expect(userInDb?.kycRequired).toBe(false);
  });

  it("Test 2: Same request as regular USER role returns HTTP 403 Forbidden", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": regularUserId,
      },
      body: JSON.stringify({ kycRequired: false }),
    });

    const res = await toggleKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(403);
  });

  it("Test 3: After toggle to false, kycGateService.getAccessStatus(userId) returns 'FULL_ACCESS' even when KYC_REQUIRED is 'true' platform-wide", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    // Verify target user currently has kycRequired = false and no verification docs submitted
    const status = await kycGateService.getAccessStatus(targetUserId);
    expect(status).toBe("FULL_ACCESS");
  });

  it("Test 4: Toggle to false writes AuditLog entry with KYC_USER_OVERRIDE action", async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "KYC_USER_OVERRIDE",
        entityId: targetUserId,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
    const latest = auditLogs[0];
    expect(latest.actorUserId).toBe(ownerUserId);
    expect(latest.entityType).toBe("User");
    expect((latest.beforeState as any)?.kycRequired).toBe(true);
    expect((latest.afterState as any)?.kycRequired).toBe(false);
  });

  it("Test 5: PATCH with non-existent userId returns HTTP 404 Not Found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${fakeId}/kyc-toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ kycRequired: false }),
    });

    const res = await toggleKyc(req, { params: { userId: fakeId } });
    expect(res.status).toBe(404);
  });

  it("Test 6: PATCH with invalid or missing kycRequired body returns HTTP 400 Bad Request", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ kycRequired: "not_a_boolean" }),
    });

    const res = await toggleKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(400);
  });

  it("Test 7: Toggling back to kycRequired = true updates DB and creates subsequent audit log", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ kycRequired: true }),
    });

    const res = await toggleKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(200);

    const userInDb = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    expect(userInDb?.kycRequired).toBe(true);

    // Gate should now return NEEDS_UPLOAD because KYC_REQUIRED is true and target user has no documents
    const status = await kycGateService.getAccessStatus(targetUserId);
    expect(status).toBe("NEEDS_UPLOAD");
  });
});
