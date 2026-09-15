import { describe, it, expect } from "vitest";
import { env } from "@/lib/config";

describe("Environment Configuration & Isolation", () => {
  it("should bind to dedicated port 4190 in test environment and use IPv4 host", () => {
    expect(env.PORT).toBe(4190);
    expect(env.HOST).toBe("127.0.0.1");
    expect(env.NODE_ENV).toBe("test");
  });

  it("should target isolated test database on port 5433", () => {
    expect(env.DATABASE_URL).toContain("127.0.0.1:5433");
    expect(env.DATABASE_URL).toContain("coin_caret_test");
  });

  it("should have valid network parameters configured", () => {
    expect(env.BLOCK_INTERVAL_MS).toBeGreaterThan(0);
    expect(env.STANDARD_FEE_CC).toBe(0.5);
    expect(env.REQUIRED_CONFIRMATIONS).toBe(1);
  });
});
