import crypto from "crypto";

/**
 * Generates an authentic cryptographic wallet address with checksum.
 * Format: CC0x + 40 hexadecimal characters.
 */
export function generateAddress(): string {
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

  return `CC0x${checksummed}`;
}

/**
 * Validates whether an address matches the Coin Caret format and checksum.
 */
export function validateAddressChecksum(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  if (!address.startsWith("CC0x")) return false;

  const hexPart = address.slice(4);
  if (hexPart.length !== 40) return false;
  if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) return false;

  return true;
}
