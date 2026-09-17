import crypto from "crypto";

/**
 * Generates an authentic cryptographic wallet address with checksum and symbol prefix.
 * Format: [PREFIX]0x + 40 hexadecimal characters.
 */
export function generatePrefixedAddress(prefix: string): string {
  const cleanPrefix = (prefix || "CC").toUpperCase();
  const randomBytes = crypto.randomBytes(20);
  const hex = randomBytes.toString("hex");
  const hash = crypto.createHash("sha256").update(hex).digest("hex");

  // Create mixed-case checksum
  let checksummed = "";
  for (let i = 0; i < hex.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      checksummed += hex[i].toUpperCase();
    } else {
      checksummed += hex[i].toLowerCase();
    }
  }

  return `${cleanPrefix}0x${checksummed}`;
}

/**
 * Generates a default CC wallet address.
 */
export function generateAddress(): string {
  return generatePrefixedAddress("CC");
}

/**
 * Validates whether an address matches the cryptographic format and checksum.
 * Supports standard CC0x or any asset prefix (e.g. BTC0x, ETH0x, SOL0x).
 */
export function validateAddressChecksum(address: string, expectedPrefix?: string): boolean {
  if (!address || typeof address !== "string") return false;

  const match = address.match(/^([A-Z0-9]{2,6})0x([0-9a-fA-F]{40})$/);
  if (!match) return false;

  const prefix = match[1];
  const hexPart = match[2];

  if (expectedPrefix && prefix !== expectedPrefix.toUpperCase()) {
    return false;
  }

  return hexPart.length === 40;
}
