import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { kycService } from "@/modules/kyc/service/kyc.service";
import { GET as getUserDetail } from "@/app/api/admin/users/[userId]/route";
import { POST as reviewKyc } from "@/app/api/admin/users/[userId]/kyc-review/route";
import { GET as getKycDocument } from "@/app/api/admin/kyc/document/[documentId]/route";
import { NextRequest } from "next/server";

describe("W-906: Admin User Detail Page API Integration Tests", () => {
  const timestamp = Date.now();
  let ownerUserId: string;
  let regularUserId: string;
  let targetUserId: string;
  let targetDocId: string;
  let noDocUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const ownerReg = await registerUser({
      email: `admin_detail_owner_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Detail Owner",
      phoneNumber: "+1-555-019-7001",
      address: "100 Sovereign Plaza, Austin, TX",
    });
    ownerUserId = ownerReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: ownerUserId } });
    await prisma.userRole.create({ data: { userId: ownerUserId, roleId: ownerRole.id } });

    const regularReg = await registerUser({
      email: `admin_detail_regular_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Regular User",
      phoneNumber: "+1-555-019-7002",
      address: "200 Regular St, Austin, TX",
    });
    regularUserId = regularReg.user.id;

    const targetReg = await registerUser({
      email: `target_kyc_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Target Verification User",
      phoneNumber: "+1-555-019-7003",
      address: "300 Identity Way, Austin, TX",
    });
    targetUserId = targetReg.user.id;

    // Submit KYC in manual review mode to get PENDING_REVIEW status with documents
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REVIEW_MODE" },
      update: { value: "manual" },
      create: { key: "KYC_REVIEW_MODE", value: "manual" },
    });

    const submission = await kycService.submitVerification({
      userId: targetUserId,
      ssnPlaintext: "123-45-6789",
      documents: {
        ssnCard: {
          fileName: "ssn_card.png",
          mimeType: "image/png",
          fileSizeBytes: 1024,
          buffer: Buffer.from("dummy-png-buffer-content"),
        },
        federalId: {
          fileName: "passport.pdf",
          mimeType: "application/pdf",
          fileSizeBytes: 2048,
          buffer: Buffer.from("dummy-pdf-buffer-content"),
        },
        drivingLicense: {
          fileName: "license.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: 1536,
          buffer: Buffer.from("dummy-jpg-buffer-content"),
        },
      },
    });

    const doc = await prisma.kycDocument.findFirst({
      where: { userVerificationId: submission.verificationId },
    });
    targetDocId = doc!.id;

    const noDocReg = await registerUser({
      email: `no_doc_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "No Doc User",
      phoneNumber: "+1-555-019-7004",
      address: "400 Unverified Rd, Austin, TX",
    });
    noDocUserId = noDocReg.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Test 1: GET /api/admin/users/[userId] returns full user detail, verification, and 8 asset wallets with balances", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}`, {
      headers: { "x-user-id": ownerUserId },
    });

    const res = await getUserDetail(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(targetUserId);
    expect(data.email).toBe(`target_kyc_${timestamp}@coincaret.com`);
    expect(data.displayName).toBe("Target Verification User");
    expect(data.phoneNumber).toBe("+1-555-019-7003");
    expect(data.address).toBe("300 Identity Way, Austin, TX");
    expect(data.verification).toBeDefined();
    expect(data.verification.status).toBe("PENDING_REVIEW");
    expect(data.verification.documents.length).toBe(3);
    expect(Array.isArray(data.wallets)).toBe(true);
    expect(data.wallets.length).toBe(8); // 8 supported assets
  });

  it("Test 2: GET /api/admin/users/non-existent-id returns HTTP 404 Not Found", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${fakeId}`, {
      headers: { "x-user-id": ownerUserId },
    });

    const res = await getUserDetail(req, { params: { userId: fakeId } });
    expect(res.status).toBe(404);
  });

  it("Test 3: POST /api/admin/users/[userId]/kyc-review with APPROVE updates status to APPROVED and creates AuditLog", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({
        action: "APPROVE",
        notes: "Identity documents verified successfully by compliance audit.",
      }),
    });

    const res = await reviewKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("APPROVED");

    const verInDb = await prisma.userVerification.findUnique({
      where: { userId: targetUserId },
    });
    expect(verInDb?.status).toBe("APPROVED");
    expect(verInDb?.reviewedByUserId).toBe(ownerUserId);
  });

  it("Test 4: POST /api/admin/users/[userId]/kyc-review with REJECT updates status to REJECTED with reviewNotes", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${targetUserId}/kyc-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({
        action: "REJECT",
        notes: "Driver's license image too blurry, please re-upload a clear scan.",
      }),
    });

    const res = await reviewKyc(req, { params: { userId: targetUserId } });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("REJECTED");

    const verInDb = await prisma.userVerification.findUnique({
      where: { userId: targetUserId },
    });
    expect(verInDb?.status).toBe("REJECTED");
    expect(verInDb?.reviewNotes).toBe("Driver's license image too blurry, please re-upload a clear scan.");
  });

  it("Test 5: POST /api/admin/users/[userId]/kyc-review with APPROVE when no documents submitted returns HTTP 422", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users/${noDocUserId}/kyc-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({
        action: "APPROVE",
        notes: "Attempting to approve without docs",
      }),
    });

    const res = await reviewKyc(req, { params: { userId: noDocUserId } });
    expect(res.status).toBe(422);
  });

  it("Test 6: GET /api/admin/kyc/document/[documentId] returns document binary buffer with Content-Type header", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/kyc/document/${targetDocId}`, {
      headers: { "x-user-id": ownerUserId },
    });

    const res = await getKycDocument(req, { params: { documentId: targetDocId } });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBeDefined();

    const arrayBuffer = await res.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);
  });

  it("Test 7: GET /api/admin/kyc/document/[documentId] as regular USER returns HTTP 403 Forbidden", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/kyc/document/${targetDocId}`, {
      headers: { "x-user-id": regularUserId },
    });

    const res = await getKycDocument(req, { params: { documentId: targetDocId } });
    expect(res.status).toBe(403);
  });
});
