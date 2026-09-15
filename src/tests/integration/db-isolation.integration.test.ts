import { describe, it, expect } from "vitest";
import { env } from "@/lib/config";

describe("Database Isolation Integration Verification", () => {
  it("strictly prohibits connecting to development database during test runs", () => {
    // Verify that the test connection does NOT point to coin_caret_dev or port 5432
    expect(env.DATABASE_URL).not.toContain("coin_caret_dev");
    expect(env.DATABASE_URL).not.toContain(":5432/");
    expect(env.DATABASE_URL).toContain("coin_caret_test");
    expect(env.DATABASE_URL).toContain(":5433/");
  });
});
