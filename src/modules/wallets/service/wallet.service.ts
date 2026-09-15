import { generateAddress } from "./address.service";
import { provisionWallet, findWalletByAddress, findWalletById } from "../repository/wallet.repository";

export async function createDefaultWallet(userId: string) {
  const address = generateAddress();
  return provisionWallet(userId, address);
}

export async function getWalletByAddress(address: string) {
  return findWalletByAddress(address);
}

export async function getWalletDetails(walletId: string) {
  return findWalletById(walletId);
}
