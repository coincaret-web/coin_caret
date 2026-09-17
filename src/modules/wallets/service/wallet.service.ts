import { generateAddress, generatePrefixedAddress } from "./address.service";
import { provisionWallet, findWalletByAddress, findWalletById } from "../repository/wallet.repository";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";
import { prisma } from "@/lib/prisma";

export async function createDefaultWallet(userId: string) {
  const address = generateAddress();
  return provisionWallet(userId, address);
}

/**
 * Provisions 8 dedicated multi-currency internal wallets for the user atomically.
 */
export async function provisionAllWalletsForUser(userId: string) {
  return prisma.$transaction(async (tx) => {
    const createdWallets = [];

    for (const assetDef of SUPPORTED_ASSETS) {
      let asset = await tx.asset.findUnique({
        where: { symbol: assetDef.symbol },
      });

      if (!asset) {
        asset = await tx.asset.create({
          data: {
            symbol: assetDef.symbol,
            name: assetDef.name,
            decimals: assetDef.decimals,
            type: assetDef.type,
            isActive: true,
          },
        });
      }

      const address = generatePrefixedAddress(asset.symbol);
      const label = `${asset.name} Vault`;

      const wallet = await provisionWallet(userId, address, asset.id, label, tx);
      createdWallets.push(wallet);
    }

    return createdWallets;
  });
}

/**
 * Ensures that all 8 supported asset wallets exist for a user.
 * If any asset wallets are missing, they are provisioned immediately.
 */
export async function ensureAllWalletsForUser(userId: string) {
  const existingWallets = await prisma.wallet.findMany({
    where: { userId },
    include: {
      asset: true,
      addresses: true,
      ledgerAccounts: true,
    },
  });

  const existingSymbols = new Set(existingWallets.map((w) => w.asset?.symbol));
  const missingAssets = SUPPORTED_ASSETS.filter((a) => !existingSymbols.has(a.symbol));

  if (missingAssets.length > 0) {
    for (const assetDef of missingAssets) {
      let asset = await prisma.asset.findUnique({
        where: { symbol: assetDef.symbol },
      });

      if (!asset) {
        asset = await prisma.asset.create({
          data: {
            symbol: assetDef.symbol,
            name: assetDef.name,
            decimals: assetDef.decimals,
            type: assetDef.type,
            isActive: true,
          },
        });
      }

      const address = generatePrefixedAddress(asset.symbol);
      const label = `${asset.name} Vault`;
      await provisionWallet(userId, address, asset.id, label);
    }

    return prisma.wallet.findMany({
      where: { userId },
      include: {
        asset: true,
        addresses: true,
        ledgerAccounts: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  return existingWallets;
}


export async function getWalletByAddress(address: string) {
  return findWalletByAddress(address);
}

export async function getWalletDetails(walletId: string) {
  return findWalletById(walletId);
}
