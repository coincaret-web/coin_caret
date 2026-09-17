/**
 * wallet-resolver.service.ts
 *
 * Resolves the correct user wallet for send and other financial operations.
 * Supports resolution by:
 *   1. Explicit `fromWalletId` (with ownership guard)
 *   2. `assetSymbol` — finds the wallet whose Asset.symbol matches
 *   3. Fallback: first wallet (for backward compatibility — resolves CC)
 */
import { prisma } from "@/lib/prisma";

interface ResolveWalletInput {
  userId: string;
  fromWalletId?: string;
  assetSymbol?: string;
}

/**
 * Resolves the sending wallet for a user. Throws clearly-named errors on
 * authorization failures or missing wallets so API routes can surface them.
 */
export async function resolveWalletForSend(input: ResolveWalletInput) {
  const { userId, fromWalletId, assetSymbol } = input;

  // ── Path 1: Explicit wallet ID provided — verify ownership ──────────────
  if (fromWalletId) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: fromWalletId, userId },
      include: { addresses: true, asset: true },
    });

    if (!wallet) {
      throw new Error("Unauthorized: wallet not found or does not belong to this user.");
    }

    if (wallet.isFrozen) {
      throw new Error(`Wallet for ${wallet.asset.symbol} is currently frozen.`);
    }

    return wallet;
  }

  // ── Path 2: Resolve by asset symbol ─────────────────────────────────────
  if (assetSymbol) {
    const normalizedSymbol = assetSymbol.trim().toUpperCase();
    const wallet = await prisma.wallet.findFirst({
      where: { userId, asset: { symbol: normalizedSymbol } },
      include: { addresses: true, asset: true },
    });

    if (!wallet) {
      throw new Error(
        `No ${normalizedSymbol} wallet found for this user. ` +
          `Please ensure your ${normalizedSymbol} vault has been provisioned.`
      );
    }

    if (wallet.isFrozen) {
      throw new Error(`${normalizedSymbol} wallet is currently frozen.`);
    }

    return wallet;
  }

  // ── Path 3: Fallback — resolve first wallet (CC for seeded users) ────────
  const defaultWallet = await prisma.wallet.findFirst({
    where: { userId },
    include: { addresses: true, asset: true },
    orderBy: { createdAt: "asc" },
  });

  if (!defaultWallet) {
    throw new Error("No wallet found for this user.");
  }

  if (defaultWallet.isFrozen) {
    throw new Error("Default wallet is currently frozen.");
  }

  return defaultWallet;
}
