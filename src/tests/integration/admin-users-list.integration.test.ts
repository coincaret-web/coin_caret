import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/identity/service/auth.service";
import { GET as getAdminUsers } from "@/app/api/admin/users/route";
import { NextRequest } from "next/server";

describe("W-905: Admin Users List Page API Integration Tests", () => {
  const timestamp = Date.now();
  let ownerUserId: string;
  let regularUserId: string;
  let userAliceId: string;
  let userBobId: string;
  let userCharlieId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const ownerRole = await prisma.role.upsert({
      where: { name: "PLATFORM_OWNER" },
      update: {},
      create: { name: "PLATFORM_OWNER", description: "Platform Owner" },
    });

    const ownerReg = await registerUser({
      email: `admin_list_owner_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "List Owner",
      phoneNumber: "+1-555-019-1111",
      address: "100 Sovereign Plaza, Austin, TX",
    });
    ownerUserId = ownerReg.user.id;
    await prisma.userRole.deleteMany({ where: { userId: ownerUserId } });
    await prisma.userRole.create({ data: { userId: ownerUserId, roleId: ownerRole.id } });

    const regularReg = await registerUser({
      email: `admin_list_regular_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Regular List User",
      phoneNumber: "+1-555-019-2222",
      address: "200 Regular St, Austin, TX",
    });
    regularUserId = regularReg.user.id;

    // Seed 3 unique test users
    const aliceReg = await registerUser({
      email: `alice_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Alice Satoshi",
      phoneNumber: "+1-555-019-3333",
      address: "300 Blockchain Way, Austin, TX",
    });
    userAliceId = aliceReg.user.id;

    const bobReg = await registerUser({
      email: `bob_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Bob Nakamoto",
      phoneNumber: "+1-555-019-4444",
      address: "400 Genesis Blvd, Austin, TX",
    });
    userBobId = bobReg.user.id;

    const charlieReg = await registerUser({
      email: `charlie_${timestamp}@coincaret.com`,
      password: "Password123!",
      displayName: "Charlie Finney",
      phoneNumber: "+1-555-019-5555",
      address: "500 Merkle Ct, Austin, TX",
    });
    userCharlieId = charlieReg.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Test 1: GET /api/admin/users as Platform Owner returns paginated user list with full DTO fields", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/users?limit=50", {
      headers: {
        "x-user-id": ownerUserId,
      },
    });

    const res = await getAdminUsers(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(3);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBeGreaterThanOrEqual(1);

    const alice = data.users.find((u: any) => u.id === userAliceId);
    expect(alice).toBeDefined();
    expect(alice.email).toBe(`alice_${timestamp}@coincaret.com`);
    expect(alice.displayName).toBe("Alice Satoshi");
    expect(alice.phoneNumber).toBe("+1-555-019-3333");
    expect(alice.status).toBe("ACTIVE");
    expect(alice.kycStatus).toBe("NOT_SUBMITTED");
    expect(alice.kycRequired).toBe(true);
    expect(Array.isArray(alice.roles)).toBe(true);
  });

  it("Test 2: GET /api/admin/users?q=alice filters matching users by name/email", async () => {
    const req = new NextRequest(`http://127.0.0.1:3847/api/admin/users?q=alice_${timestamp}`, {
      headers: {
        "x-user-id": ownerUserId,
      },
    });

    const res = await getAdminUsers(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.users.length).toBe(1);
    expect(data.users[0].id).toBe(userAliceId);
    expect(data.users[0].displayName).toBe("Alice Satoshi");
  });

  it("Test 3: GET /api/admin/users?page=2&limit=2 returns correct sliced pagination", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/users?page=2&limit=2", {
      headers: {
        "x-user-id": ownerUserId,
      },
    });

    const res = await getAdminUsers(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.page).toBe(2);
    expect(data.users.length).toBeLessThanOrEqual(2);
    expect(data.total).toBeGreaterThanOrEqual(3);
  });

  it("Test 4: GET /api/admin/users as regular USER role returns HTTP 403 Forbidden", async () => {
    const req = new NextRequest("http://127.0.0.1:3847/api/admin/users", {
      headers: {
        "x-user-id": regularUserId,
      },
    });

    const res = await getAdminUsers(req);
    expect(res.status).toBe(403);
  });
});
