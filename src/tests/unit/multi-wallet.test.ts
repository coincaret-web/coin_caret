import { describe, it, expect } from "vitest";
import { generatePrefixedAddress, validateAddressChecksum } from "@/modules/wallets/service/address.service";

describe("Multi-Asset Cryptographic Address Generator (W-702 Unit)", () => {
  it("should generate valid prefixed addresses for all supported symbols", () => {
    const symbols = ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"];

    for (const symbol of symbols) {
      const address = generatePrefixedAddress(symbol);
      expect(address.startsWith(`${symbol}0x`)).toBe(true);
      expect(address.length).toBe(symbol.length + 2 + 40);
      expect(validateAddressChecksum(address)).toBe(true);
    }
  });

  it("should produce zero collisions across 1,000 generated addresses", () => {
    const generated = new Set<string>();
    const symbols = ["CC", "BTC", "ETH", "SOL"];

    for (let i = 0; i < 1000; i++) {
      const symbol = symbols[i % symbols.length];
      const address = generatePrefixedAddress(symbol);
      expect(generated.has(address)).toBe(false);
      generated.add(address);
    }

    expect(generated.size).toBe(1000);
  });

  it("should validate checksums and reject malformed addresses", () => {
    const btcAddress = generatePrefixedAddress("BTC");
    expect(validateAddressChecksum(btcAddress)).toBe(true);

    // Corrupted hex length
    expect(validateAddressChecksum(btcAddress.slice(0, -1))).toBe(false);
    expect(validateAddressChecksum(btcAddress + "a")).toBe(false);

    // Non-hex character
    const corruptedHex = btcAddress.slice(0, -1) + "Z";
    expect(validateAddressChecksum(corruptedHex)).toBe(false);

    // Missing 0x
    expect(validateAddressChecksum("BTC" + btcAddress.slice(5))).toBe(false);

    // Null/undefined/empty
    expect(validateAddressChecksum("")).toBe(false);
    expect(validateAddressChecksum(null as any)).toBe(false);
    expect(validateAddressChecksum(undefined as any)).toBe(false);
  });
});
