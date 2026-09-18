import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { kycGateService } from "@/modules/kyc/service/kyc-gate.service";
import { PATCH as updateConfig } from "@/app/api/admin/config/route";
import { GET as getKycGate } from "@/app/api/kyc/gate/route";
import { NextRequest } from "next/server";

describe("W-903: KYC Platform Controls & Wallet Access Gate Integration Tests", () => {
  const timestamp = Date.now();
  let adminUserId: string;
  let regularUserId: string;
  let approvedUserId: string;
  let pendingUserId: string;
  let rejectedUserId: string;
  let exemptUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const adminReg = await registerUser({
      email: `gate_admin_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Admin Gate User",
      phoneNumber: "+1-555-019-9999",
      address: "100 Admin HQ, Austin, TX",
    });
    adminUserId = adminReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: adminUserId } });
    await prisma.userRole.create({ data: { userId: adminUserId, roleId: ownerRole.id } });

    // Create test users
    const u1 = await registerUser({
      email: `gate_user_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Regular Gate User",
      phoneNumber: "+1-555-019-2001",
      address: "101 Gate Way, Austin, TX",
    });
    regularUserId = u1.user.id;

    const u2 = await registerUser({
      email: `gate_approved_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Approved Gate User",
      phoneNumber: "+1-555-019-2002",
      address: "102 Gate Way, Austin, TX",
    });
    approvedUserId = u2.user.id;
    await prisma.userVerification.create({
      data: {
        userId: approvedUserId,
        status: "APPROVED",
        ssnEncrypted: "enc_mock_approved",
        ssnIv: "iv_mock",
        ssnAuthTag: "tag_mock",
      },
    });

    const u3 = await registerUser({
      email: `gate_pending_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Pending Gate User",
      phoneNumber: "+1-555-019-2003",
      address: "103 Gate Way, Austin, TX",
    });
    pendingUserId = u3.user.id;
    await prisma.userVerification.create({
      data: {
        userId: pendingUserId,
        status: "PENDING_REVIEW",
        ssnEncrypted: "enc_mock_pending",
        ssnIv: "iv_mock",
        ssnAuthTag: "tag_mock",
      },
    });

    const u4 = await registerUser({
      email: `gate_rejected_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Rejected Gate User",
      phoneNumber: "+1-555-019-2004",
      address: "104 Gate Way, Austin, TX",
    });
    rejectedUserId = u4.user.id;
    await prisma.userVerification.create({
      data: {
        userId: rejectedUserId,
        status: "REJECTED",
        ssnEncrypted: "enc_mock_rejected",
        ssnIv: "iv_mock",
        ssnAuthTag: "tag_mock",
        reviewNotes: "Document illegible",
      },
    });

    const u5 = await registerUser({
      email: `gate_exempt_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Exempt Gate User",
      phoneNumber: "+1-555-019-2005",
      address: "105 Gate Way, Austin, TX",
    });
    exemptUserId = u5.user.id;
    // Set kycRequired = false on user
    await prisma.user.update({
      where: { id: exemptUserId },
      data: { kycRequired: false },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Test 1: KYC_REQUIRED = 'false' -> returns FULL_ACCESS regardless of user verification status", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "false" },
      create: { key: "KYC_REQUIRED", value: "false" },
    });

    const status = await kycGateService.getAccessStatus(regularUserId);
    expect(status).toBe("FULL_ACCESS");
  });

  it("Test 2: KYC_REQUIRED = 'true', user has no UserVerification -> returns NEEDS_UPLOAD", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const status = await kycGateService.getAccessStatus(regularUserId);
    expect(status).toBe("NEEDS_UPLOAD");
  });

  it("Test 3: KYC_REQUIRED = 'true', user status = PENDING_REVIEW -> returns AWAITING_REVIEW", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const status = await kycGateService.getAccessStatus(pendingUserId);
    expect(status).toBe("AWAITING_REVIEW");
  });

  it("Test 4: KYC_REQUIRED = 'true', user status = APPROVED -> returns FULL_ACCESS", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const status = await kycGateService.getAccessStatus(approvedUserId);
    expect(status).toBe("FULL_ACCESS");
  });

  it("Test 5: KYC_REQUIRED = 'true', user status = REJECTED -> returns REJECTED_REUPLOAD", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const status = await kycGateService.getAccessStatus(rejectedUserId);
    expect(status).toBe("REJECTED_REUPLOAD");
  });

  it("Test 6: KYC_REQUIRED = 'true', per-user kycRequired = false -> returns FULL_ACCESS", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const status = await kycGateService.getAccessStatus(exemptUserId);
    expect(status).toBe("FULL_ACCESS");
  });

  it("Test 7: PATCH /api/admin/config with KYC_REQUIRED as Admin -> 200; as regular USER -> 403", async () => {
    // Admin request
    const adminReq = new NextRequest("http://localhost:3000/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ key: "KYC_REQUIRED", value: "true" }),
    });
    const adminRes = await updateConfig(adminReq);
    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();
    expect(adminData.success).toBe(true);

    // Regular user request
    const userReq = new NextRequest("http://localhost:3000/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": regularUserId,
      },
      body: JSON.stringify({ key: "KYC_REQUIRED", value: "false" }),
    });
    const userRes = await updateConfig(userReq);
    expect(userRes.status).toBe(403);
  });

  it("Test 8: PATCH /api/admin/config with invalid KYC_REVIEW_MODE -> 400 Bad Request", async () => {
    const invalidReq = new NextRequest("http://localhost:3000/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ key: "KYC_REVIEW_MODE", value: "invalid_mode" }),
    });
    const res = await updateConfig(invalidReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("Test 9: PATCH /api/admin/config with invalid KYC_REQUIRED -> 400 Bad Request", async () => {
    const invalidReq = new NextRequest("http://localhost:3000/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ key: "KYC_REQUIRED", value: "not_a_boolean" }),
    });
    const res = await updateConfig(invalidReq);
    expect(res.status).toBe(400);
  });

  it("Test 10: GET /api/kyc/gate returns accessStatus for authenticated user", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REQUIRED" },
      update: { value: "true" },
      create: { key: "KYC_REQUIRED", value: "true" },
    });

    const gateReq = new NextRequest("http://localhost:3000/api/kyc/gate", {
      headers: { "x-user-id": approvedUserId },
    });
    const res = await getKycGate(gateReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accessStatus).toBe("FULL_ACCESS");
  });
});
