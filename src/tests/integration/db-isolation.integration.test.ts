import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Live PostgreSQL Database Isolation (Integration)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("actively connects to live PostgreSQL test database and confirms database name is coin_caret_test", async () => {
    const result = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database()`;

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].current_database).toBe("coin_caret_test");
  });

  it("confirms database tables exist and are ready for transactions", async () => {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;

    const tableNames = tables.map((t) => t.tablename);
    expect(tableNames).toContain("users");
    expect(tableNames).toContain("wallets");
    expect(tableNames).toContain("wallet_addresses");
    expect(tableNames).toContain("ledger_accounts");
    expect(tableNames).toContain("ledger_entries");
    expect(tableNames).toContain("transactions");
    expect(tableNames).toContain("blocks");
  });
});
