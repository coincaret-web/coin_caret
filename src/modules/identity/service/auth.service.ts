import bcrypt from "bcryptjs";
import { findUserByEmail, createUserWithRole } from "../repository/user.repository";
import { provisionAllWalletsForUser } from "@/modules/wallets/service/wallet.service";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  address?: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUserWithRole({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
    phoneNumber: input.phoneNumber || "+1-555-000-0000",
    address: input.address || "1 Sovereign Plaza, Financial District",
  });

  // Auto-provision all 8 multi-asset wallets and ledger accounts atomically
  const wallets = await provisionAllWalletsForUser(user.id);
  const primaryCcWallet = wallets.find((w) => w.asset.symbol === "CC") || wallets[0];

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.roles[0]?.role?.name ?? "USER",
    },
    wallet: {
      id: primaryCcWallet.id,
      address: primaryCcWallet.addresses[0]?.address,
    },
    wallets: wallets.map((w) => ({
      id: w.id,
      assetSymbol: w.asset.symbol,
      address: w.addresses[0]?.address,
    })),
  };
}
