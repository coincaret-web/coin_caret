import bcrypt from "bcryptjs";
import { findUserByEmail, createUserWithRole } from "../repository/user.repository";
import { createDefaultWallet } from "@/modules/wallets/service/wallet.service";

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
  });

  // Auto-provision native CC wallet and ledger accounts
  const wallet = await createDefaultWallet(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.roles[0]?.role?.name ?? "USER",
    },
    wallet: {
      id: wallet.id,
      address: wallet.addresses[0]?.address,
    },
  };
}
