import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/auth/register/route";

describe("W-901: Extended Registration Integration Tests", () => {
  const testEmailPrefix = `test-w901-${Date.now()}`;

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test-w901-" } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: "test-w901-" } },
    });
    await prisma.$disconnect();
  });

  it("POST /api/auth/register with valid phoneNumber and address stores them in profiles table", async () => {
    const email = `${testEmailPrefix}-success@coincaret.com`;
    const payload = {
      displayName: "Jane Satoshi",
      email,
      password: "Password123!",
      phoneNumber: "+1-555-867-5309",
      address: "123 Blockchain Ave, NYC 10001",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.user).toBeDefined();
    expect(json.user.email).toBe(email);

    const profile = await prisma.profile.findUnique({
      where: { userId: json.user.id },
    });

    expect(profile).not.toBeNull();
    expect((profile as any)?.phoneNumber).toBe("+1-555-867-5309");
    expect((profile as any)?.address).toBe("123 Blockchain Ave, NYC 10001");
  });

  it("POST /api/auth/register without phoneNumber returns HTTP 400 Bad Request", async () => {
    const email = `${testEmailPrefix}-nophone@coincaret.com`;
    const payload = {
      displayName: "Jane Satoshi",
      email,
      password: "Password123!",
      address: "123 Blockchain Ave, NYC 10001",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("POST /api/auth/register without address returns HTTP 400 Bad Request", async () => {
    const email = `${testEmailPrefix}-noaddr@coincaret.com`;
    const payload = {
      displayName: "Jane Satoshi",
      email,
      password: "Password123!",
      phoneNumber: "+1-555-867-5309",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("POST /api/auth/register with phoneNumber < 7 digits returns HTTP 400 Bad Request", async () => {
    const email = `${testEmailPrefix}-shortphone@coincaret.com`;
    const payload = {
      displayName: "Jane Satoshi",
      email,
      password: "Password123!",
      phoneNumber: "12345",
      address: "123 Blockchain Ave, NYC 10001",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
