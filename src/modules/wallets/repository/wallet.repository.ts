import { prisma } from "@/lib/prisma";
import { AccountType } from "@prisma/client";

export async function getOrCreateNativeAsset() {
  let asset = await prisma.asset.findUnique({
    where: { symbol: "CC" },
  });

  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        symbol: "CC",
        name: "Coin Caret",
        decimals: 8,
        isActive: true,
      },
    });
  }

  return asset;
}

export async function provisionWallet(userId: string, address: string) {
  const asset = await getOrCreateNativeAsset();

  return prisma.wallet.create({
    data: {
      userId,
      assetId: asset.id,
      label: "Main CC Wallet",
      addresses: {
        create: {
          address,
          isPrimary: true,
        },
      },
      ledgerAccounts: {
        create: [
          {
            assetId: asset.id,
            accountType: AccountType.AVAILABLE,
          },
          {
            assetId: asset.id,
            accountType: AccountType.RESERVED_PENDING,
          },
        ],
      },
    },
    include: {
      addresses: true,
      ledgerAccounts: true,
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
