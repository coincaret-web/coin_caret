import { describe, it, expect } from "vitest";
import { registerSchema } from "@/types/user";

describe("W-901: Extended Registration Unit Tests (Zod Validation)", () => {
  const validBase = {
    displayName: "Jane Satoshi",
    email: "jane@coincaret.com",
    password: "Password123!",
  };

  it("rejects phoneNumber with fewer than 7 characters", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      phoneNumber: "123456",
      address: "123 Blockchain Ave, NYC 10001",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("phoneNumber"))).toBe(true);
    }
  });

  it("rejects address with fewer than 10 characters", () => {
    const result = registerSchema.safeParse({
      ...validBase,
      phoneNumber: "+1-555-867-5309",
      address: "Short Rd",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("address"))).toBe(true);
    }
  });

  it("accepts valid international phoneNumber formats", () => {
    const internationalNumbers = [
      "+1-555-867-5309",
      "+92-333-1234567",
      "+44 20 7946 0958",
      "03331234567",
    ];

    for (const num of internationalNumbers) {
      const result = registerSchema.safeParse({
        ...validBase,
        phoneNumber: num,
        address: "123 Blockchain Ave, NYC 10001",
      });

      expect(result.success).toBe(true);
    }
  });

  it("rejects missing phoneNumber or address", () => {
    const noPhone = registerSchema.safeParse({
      ...validBase,
      address: "123 Blockchain Ave, NYC 10001",
    });
    expect(noPhone.success).toBe(false);

    const noAddress = registerSchema.safeParse({
      ...validBase,
      phoneNumber: "+1-555-867-5309",
    });
    expect(noAddress.success).toBe(false);
  });
});
