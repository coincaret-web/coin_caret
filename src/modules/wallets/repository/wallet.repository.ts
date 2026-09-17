import { prisma } from "@/lib/prisma";
import { AccountType, Prisma } from "@prisma/client";

export async function getOrCreateNativeAsset(db: Prisma.TransactionClient | typeof prisma = prisma) {
  let asset = await db.asset.findUnique({
    where: { symbol: "CC" },
  });

  if (!asset) {
    asset = await db.asset.create({
      data: {
        symbol: "CC",
        name: "Coin Caret Native Currency",
        decimals: 8,
        isActive: true,
      },
    });
  }

  return asset;
}

export async function provisionWallet(
  userId: string,
  address: string,
  assetId?: string,
  label?: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  let targetAssetId = assetId;
  let targetLabel = label;

  if (!targetAssetId) {
    const defaultAsset = await getOrCreateNativeAsset(db);
    targetAssetId = defaultAsset.id;
    if (!targetLabel) targetLabel = "Main CC Wallet";
  }

  return db.wallet.create({
    data: {
      userId,
      assetId: targetAssetId,
      label: targetLabel || "Vault Wallet",
      addresses: {
        create: {
          address,
          isPrimary: true,
        },
      },
      ledgerAccounts: {
        create: [
          {
            assetId: targetAssetId,
            accountType: AccountType.AVAILABLE,
          },
          {
            assetId: targetAssetId,
            accountType: AccountType.RESERVED_PENDING,
          },
        ],
      },
    },
    include: {
      addresses: true,
      ledgerAccounts: true,
      asset: true,
    },
  });
}

export async function findWalletByAddress(address: string) {
  const walletAddress = await prisma.walletAddress.findUnique({
    where: { address },
    include: {
      wallet: {
        include: {
          ledgerAccounts: true,
          asset: true,
          user: true,
        },
      },
    },
  });

  return walletAddress?.wallet ?? null;
}

export async function findWalletById(walletId: string) {
  return prisma.wallet.findUnique({
    where: { id: walletId },
    include: {
      addresses: true,
      ledgerAccounts: true,
      asset: true,
      user: true,
    },
  });
}
