import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { POST as submitKyc } from "@/app/api/kyc/submit/route";
import { decryptSsn } from "@/modules/kyc/service/kyc-encryption.service";
import { NextRequest } from "next/server";

describe("W-902: KYC Document Submission Integration Tests", () => {
  const timestamp = Date.now();
  let autoUserId: string;
  let manualUserId: string;
  let dupUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const u1 = await registerUser({
      email: `kyc_auto_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "KYC Auto User",
      phoneNumber: "+1-555-019-1001",
      address: "100 Automated Way, Austin, TX",
    });
    autoUserId = u1.user.id;

    const u2 = await registerUser({
      email: `kyc_manual_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "KYC Manual User",
      phoneNumber: "+1-555-019-1002",
      address: "200 Manual Blvd, Austin, TX",
    });
    manualUserId = u2.user.id;

    const u3 = await registerUser({
      email: `kyc_dup_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "KYC Dup User",
      phoneNumber: "+1-555-019-1003",
      address: "300 Duplicate Ct, Austin, TX",
    });
    dupUserId = u3.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function createFormData(params: {
    ssn?: string;
    includeSsnCard?: boolean;
    includeFederalId?: boolean;
    includeDrivingLicense?: boolean;
    oversized?: boolean;
  }) {
    const formData = new FormData();
    if (params.ssn !== undefined) {
      formData.append("ssn", params.ssn);
    }

    if (params.includeSsnCard !== false) {
      const blob = new Blob([params.oversized ? new Uint8Array(11 * 1024 * 1024) : "dummy ssn card image content"], {
        type: "image/png",
      });
      formData.append("ssnCard", blob, "ssn_card.png");
    }

    if (params.includeFederalId !== false) {
      const blob = new Blob(["dummy federal id content"], { type: "application/pdf" });
      formData.append("federalId", blob, "federal_id.pdf");
    }

    if (params.includeDrivingLicense !== false) {
      const blob = new Blob(["dummy license image content"], { type: "image/jpeg" });
      formData.append("drivingLicense", blob, "license.jpg");
    }

    return formData;
  }

  it("Test 1 (Auto mode): KYC_REVIEW_MODE='automatic' results in immediate APPROVED status with 3 encrypted documents", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REVIEW_MODE" },
      update: { value: "automatic" },
      create: { key: "KYC_REVIEW_MODE", value: "automatic" },
    });

    const formData = createFormData({ ssn: "123-45-6789" });
    const req = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: {
        "x-user-id": autoUserId,
      },
    });
    (req as any)._formData = formData;

    const res = await submitKyc(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.status).toBe("APPROVED");
    expect(json.verificationId).toBeDefined();

    // Verify database record
    const verification = await prisma.userVerification.findUnique({
      where: { userId: autoUserId },
      include: { documents: true },
    });

    expect(verification).not.toBeNull();
    expect(verification?.status).toBe("APPROVED");
    expect(verification?.ssnEncrypted).not.toBe("123-45-6789");
    expect(verification?.documents.length).toBe(3);

    const docTypes = verification?.documents.map((d) => d.documentType);
    expect(docTypes).toContain("SSN_CARD");
    expect(docTypes).toContain("FEDERAL_ID");
    expect(docTypes).toContain("DRIVING_LICENSE");
  });

  it("Test 2 (Manual mode): KYC_REVIEW_MODE='manual' results in PENDING_REVIEW status", async () => {
    await prisma.platformConfig.upsert({
      where: { key: "KYC_REVIEW_MODE" },
      update: { value: "manual" },
      create: { key: "KYC_REVIEW_MODE", value: "manual" },
    });

    const formData = createFormData({ ssn: "987-65-4321" });
    const req = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: {
        "x-user-id": manualUserId,
      },
    });
    (req as any)._formData = formData;

    const res = await submitKyc(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.status).toBe("PENDING_REVIEW");

    const verification = await prisma.userVerification.findUnique({
      where: { userId: manualUserId },
      include: { documents: true },
    });

    expect(verification).not.toBeNull();
    expect(verification?.status).toBe("PENDING_REVIEW");
    expect(verification?.documents.length).toBe(3);
  });

  it("Test 3: rejects duplicate submission with HTTP 409 Conflict", async () => {
    const formData = createFormData({ ssn: "555-55-5555" });
    const req1 = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: { "x-user-id": dupUserId },
    });
    (req1 as any)._formData = formData;
    const res1 = await submitKyc(req1);
    expect(res1.status).toBe(201);

    const formDataDup = createFormData({ ssn: "555-55-5555" });
    const req2 = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: { "x-user-id": dupUserId },
    });
    (req2 as any)._formData = formDataDup;
    const res2 = await submitKyc(req2);
    expect(res2.status).toBe(409);
  });

  it("Test 4: rejects submission with missing or invalid SSN with HTTP 400", async () => {
    const formData = createFormData({ ssn: "" });
    const req = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: { "x-user-id": autoUserId },
    });
    (req as any)._formData = formData;

    const res = await submitKyc(req);
    expect(res.status).toBe(400);
  });

  it("Test 5: rejects submission missing a required document (missing driver's license) with HTTP 400", async () => {
    const formData = createFormData({ ssn: "111-22-3333", includeDrivingLicense: false });
    const req = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: { "x-user-id": autoUserId },
    });
    (req as any)._formData = formData;

    const res = await submitKyc(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("drivingLicense");
  });

  it("Test 6: rejects file exceeding 10 MB with HTTP 413 Payload Too Large", async () => {
    const formData = createFormData({ ssn: "111-22-3333", oversized: true });
    const req = new Request("http://localhost/api/kyc/submit", {
      method: "POST",
      headers: { "x-user-id": autoUserId },
    });
    (req as any)._formData = formData;

    const res = await submitKyc(req);
    expect(res.status).toBe(413);
  });

  it("Test 7: decrypts stored SSN from database confirming round-trip accuracy", async () => {
    const verification = await prisma.userVerification.findUnique({
      where: { userId: autoUserId },
    });

    expect(verification).not.toBeNull();
    const decrypted = decryptSsn(
      verification!.ssnEncrypted,
      verification!.ssnIv,
      verification!.ssnAuthTag
    );
    expect(decrypted).toBe("123-45-6789");
  });
});
