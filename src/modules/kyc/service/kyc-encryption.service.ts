import crypto from "crypto";

export class MissingEncryptionKeyError extends Error {
  constructor(message = "KYC_ENCRYPTION_KEY environment variable is not configured or invalid.") {
    super(message);
    this.name = "MissingEncryptionKeyError";
  }
}

export class DecryptionError extends Error {
  constructor(message = "Failed to decrypt data: Authentication tag validation failed or data corrupted.") {
    super(message);
    this.name = "DecryptionError";
  }
}

function getEncryptionKey(): Buffer {
  const keyHex = process.env.KYC_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new MissingEncryptionKeyError();
  }
  return Buffer.from(keyHex, "hex");
}

export function encryptSsn(plainSsn: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plainSsn, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptSsn(encryptedHex: string, ivHex: string, authTagHex: string): string {
  const key = getEncryptionKey();

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: any) {
    throw new DecryptionError();
  }
}
