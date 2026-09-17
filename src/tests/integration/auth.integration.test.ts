import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser, verifyPassword } from "@/modules/identity/service/auth.service";
import { hasPermission } from "@/lib/checkPermission";

describe("Live Identity, Auth & RBAC Database Integration (W-102)", () => {
  const testEmail = `test-user-${Date.now()}@coincaret.com`;

  beforeAll(async () => {
    // Clean up any test user with this email
    await prisma.user.deleteMany({
      where: { email: { contains: "test-user-" } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a real user, hashes password, and auto-provisions a wallet in PostgreSQL", async () => {
    const result = await registerUser({
      email: testEmail,
      password: "StrongPassword123!",
      displayName: "Alice Nakamoto",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.wallet.address).toMatch(/^CC0x[a-fA-F0-9]{40}$/);

    // Verify row directly in PostgreSQL users table
    const dbUser = await prisma.user.findUnique({
      where: { id: result.user.id },
      include: {
        profile: true,
        roles: { include: { role: true } },
        wallets: { include: { addresses: true, ledgerAccounts: true } },
      },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.displayName).toBe("Alice Nakamoto");
    expect(dbUser?.profile?.themePreference).toBe("dark");

    // Verify bcrypt password hash in DB
    const isPasswordValid = await verifyPassword("StrongPassword123!", dbUser!.passwordHash);
    expect(isPasswordValid).toBe(true);

    // Verify wallets in DB (multi-asset: 8 wallets provisioned)
    expect(dbUser?.wallets.length).toBeGreaterThanOrEqual(1);
    const ccWallet = dbUser?.wallets.find((w) => w.addresses[0]?.address.startsWith("CC0x"));
    expect(ccWallet).toBeDefined();
    expect(ccWallet?.addresses[0].address).toBe(result.wallet.address);
    expect(ccWallet?.ledgerAccounts.length).toBeGreaterThanOrEqual(2); // AVAILABLE + RESERVED
  });

  it("prevents registering duplicate email addresses in PostgreSQL", async () => {
    await expect(
      registerUser({
        email: testEmail,
        password: "AnotherPassword123!",
        displayName: "Duplicate User",
      })
    ).rejects.toThrow("already exists");
  });

  it("verifies RBAC permission matrix logic", () => {
    expect(hasPermission("PLATFORM_OWNER", "admin:treasury:mint")).toBe(true);
    expect(hasPermission("OPERATIONS_ADMIN", "admin:users:manage")).toBe(true);
    expect(hasPermission("FINANCE_OPERATOR", "admin:treasury:mint")).toBe(true);
    expect(hasPermission("FINANCE_OPERATOR", "admin:network:config")).toBe(false);
    expect(hasPermission("USER", "wallet:send")).toBe(true);
    expect(hasPermission("USER", "admin:treasury:mint")).toBe(false);
  });
});
