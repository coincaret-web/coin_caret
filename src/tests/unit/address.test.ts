import { describe, it, expect } from "vitest";
import { generateAddress, validateAddressChecksum } from "@/modules/wallets/service/address.service";

describe("Cryptographic Address Generation & Validation (W-103)", () => {
  it("generates an authentic CC address starting with CC0x and 40 hex characters", () => {
    const address = generateAddress();
    expect(address).toMatch(/^CC0x[a-fA-F0-9]{40}$/);
  });

  it("validates valid addresses with correct checksums", () => {
    const address = generateAddress();
    expect(validateAddressChecksum(address)).toBe(true);
  });

  it("rejects malformed addresses or typos", () => {
    expect(validateAddressChecksum("invalid-address")).toBe(false);
    expect(validateAddressChecksum("0x1234567890123456789012345678901234567890")).toBe(false); // Missing CC prefix
    expect(validateAddressChecksum("CC0x12345")).toBe(false); // Too short
    expect(validateAddressChecksum("CC0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBe(false); // Non-hex
  });
});
