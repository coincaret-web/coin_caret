import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { GET as getAdminConfig, PATCH as patchAdminConfig } from "@/app/api/admin/config/route";
import { GET as getPublicRate } from "@/app/api/platform/cc-usd-rate/route";
import { NextRequest } from "next/server";

describe("PlatformConfig & CC/USD Rate Integration (W-603)", () => {
  let ownerUserId: string;
  let standardUserId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const timestamp = Date.now();
    const ownerReg = await registerUser({
      email: `config_owner_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Config Owner",
    });
    ownerUserId = ownerReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: ownerUserId } });
    await prisma.userRole.create({ data: { userId: ownerUserId, roleId: ownerRole.id } });

    const userReg = await registerUser({
      email: `config_user_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Regular User",
    });
    standardUserId = userReg.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("allows PLATFORM_OWNER to PATCH CC_USD_RATE to 0.25 and stores in PostgreSQL", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ key: "CC_USD_RATE", value: "0.25" }),
    });

    const res = await patchAdminConfig(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.config.key).toBe("CC_USD_RATE");
    expect(body.config.value).toBe("0.25");

    // Verify row in PostgreSQL platform_config table
    const dbConfig = await prisma.platformConfig.findUnique({
      where: { key: "CC_USD_RATE" },
    });
    expect(dbConfig).not.toBeNull();
    expect(dbConfig?.value).toBe("0.25");
  });

  it("rejects regular USER with HTTP 403 Forbidden", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": standardUserId,
      },
      body: JSON.stringify({ key: "CC_USD_RATE", value: "0.50" }),
    });

    const res = await patchAdminConfig(req);
    expect(res.status).toBe(403);
  });

  it("exposes public GET /api/platform/cc-usd-rate with database rate", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/platform/cc-usd-rate");
    const res = await getPublicRate(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.rate).toBe("0.25");
    expect(body.updatedAt).toBeDefined();
  });

  it("rejects non-numeric string values with HTTP 400 Bad Request", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ key: "CC_USD_RATE", value: "abc" }),
    });

    const res = await patchAdminConfig(req);
    expect(res.status).toBe(400);
  });

  it("rejects negative rate values with HTTP 400 Bad Request", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/config", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerUserId,
      },
      body: JSON.stringify({ key: "CC_USD_RATE", value: "-1.00" }),
    });

    const res = await patchAdminConfig(req);
    expect(res.status).toBe(400);
  });
});
