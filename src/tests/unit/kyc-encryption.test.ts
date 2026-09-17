import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encryptSsn,
  decryptSsn,
  MissingEncryptionKeyError,
  DecryptionError,
} from "@/modules/kyc/service/kyc-encryption.service";

describe("W-902: KYC SSN Encryption Service Unit Tests (AES-256-GCM)", () => {
  const originalEnv = process.env.KYC_ENCRYPTION_KEY;
  const testKey = "0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(() => {
    process.env.KYC_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.KYC_ENCRYPTION_KEY = originalEnv;
  });

  it("encrypts SSN and does not store plaintext", () => {
    const rawSsn = "123-45-6789";
    const result = encryptSsn(rawSsn);

    expect(result.encrypted).toBeDefined();
    expect(result.iv).toBeDefined();
    expect(result.authTag).toBeDefined();
    expect(result.encrypted).not.toBe(rawSsn);
    expect(result.encrypted.length).toBeGreaterThan(0);
    expect(result.iv.length).toBeGreaterThan(0);
    expect(result.authTag.length).toBeGreaterThan(0);
  });

  it("decrypts encrypted SSN to the exact original plaintext (round-trip)", () => {
    const rawSsn = "987-65-4321";
    const { encrypted, iv, authTag } = encryptSsn(rawSsn);
    const decrypted = decryptSsn(encrypted, iv, authTag);

    expect(decrypted).toBe(rawSsn);
  });

  it("produces non-deterministic ciphertexts and IVs for the same plaintext", () => {
    const rawSsn = "123-45-6789";
    const run1 = encryptSsn(rawSsn);
    const run2 = encryptSsn(rawSsn);

    expect(run1.iv).not.toBe(run2.iv);
    expect(run1.encrypted).not.toBe(run2.encrypted);
  });

  it("throws DecryptionError when authTag is tampered with", () => {
    const rawSsn = "123-45-6789";
    const { encrypted, iv } = encryptSsn(rawSsn);
    const tamperedAuthTag = "00000000000000000000000000000000";

    expect(() => decryptSsn(encrypted, iv, tamperedAuthTag)).toThrow(DecryptionError);
  });

  it("throws MissingEncryptionKeyError when KYC_ENCRYPTION_KEY is unset or invalid", () => {
    delete process.env.KYC_ENCRYPTION_KEY;
    expect(() => encryptSsn("123-45-6789")).toThrow(MissingEncryptionKeyError);
  });
});
