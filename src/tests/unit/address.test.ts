import { describe, it, expect } from "vitest";
import { generateAddress, validateAddressChecksum } from "@/modules/wallets/service/address.service";

describe("Cryptographic Address Generation & Validation Edge Cases (W-103)", () => {
  it("generates an authentic CC address starting with CC0x and 40 hex characters", () => {
    const address = generateAddress();
    expect(address).toMatch(/^CC0x[a-fA-F0-9]{40}$/);
    expect(address.length).toBe(44);
  });

  it("generates unique addresses on successive invocations", () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateAddress());
    }
    expect(set.size).toBe(50);
  });

  it("validates valid addresses with correct format", () => {
    const address = generateAddress();
    expect(validateAddressChecksum(address)).toBe(true);
  });

  it("rejects null, undefined, non-string, or empty values", () => {
    expect(validateAddressChecksum("")).toBe(false);
    expect(validateAddressChecksum(null as any)).toBe(false);
    expect(validateAddressChecksum(undefined as any)).toBe(false);
    expect(validateAddressChecksum(12345 as any)).toBe(false);
    expect(validateAddressChecksum({} as any)).toBe(false);
  });

  it("rejects missing CC prefix or lowercase cc prefix", () => {
    expect(validateAddressChecksum("0x1234567890123456789012345678901234567890")).toBe(false);
    expect(validateAddressChecksum("cc0x1234567890123456789012345678901234567890")).toBe(false);
    expect(validateAddressChecksum("CCx12345678901234567890123456789012345678900")).toBe(false);
  });

  it("rejects invalid lengths (too short or too long)", () => {
    expect(validateAddressChecksum("CC0x12345")).toBe(false);
    expect(validateAddressChecksum("CC0x123456789012345678901234567890123456789")).toBe(false); // 39 hex chars
    expect(validateAddressChecksum("CC0x12345678901234567890123456789012345678901")).toBe(false); // 41 hex chars
  });

  it("rejects non-hex characters, whitespaces, and symbols", () => {
    expect(validateAddressChecksum("CC0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBe(false);
    expect(validateAddressChecksum("CC0x1234567890abcdef1234567890abcdef1234567g")).toBe(false);
    expect(validateAddressChecksum("CC0x 1234567890abcdef1234567890abcdef1234567")).toBe(false);
    expect(validateAddressChecksum("CC0x1234567890-bcdef1234567890abcdef12345678")).toBe(false);
  });
});
