import { AssetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SupportedAssetDefinition, AssetDto } from "@/types/asset";

export const SUPPORTED_ASSETS: SupportedAssetDefinition[] = [
  {
    symbol: "CC",
    name: "Coin Caret Native Currency",
    decimals: 8,
    type: AssetType.NATIVE_COIN,
    fallbackPrice: "0.25",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    decimals: 8,
    type: AssetType.TOKEN,
    coinGeckoId: "bitcoin",
    fallbackPrice: "65000.00",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    type: AssetType.TOKEN,
    coinGeckoId: "ethereum",
    fallbackPrice: "3400.00",
  },
  {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    type: AssetType.TOKEN,
    coinGeckoId: "solana",
    fallbackPrice: "145.00",
  },
  {
    symbol: "BNB",
    name: "BNB",
    decimals: 18,
    type: AssetType.TOKEN,
    coinGeckoId: "binancecoin",
    fallbackPrice: "560.00",
  },
  {
    symbol: "LTC",
    name: "Litecoin",
    decimals: 8,
    type: AssetType.TOKEN,
    coinGeckoId: "litecoin",
    fallbackPrice: "68.00",
  },
  {
    symbol: "XRP",
    name: "XRP",
    decimals: 6,
    type: AssetType.TOKEN,
    coinGeckoId: "ripple",
    fallbackPrice: "0.58",
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    decimals: 8,
    type: AssetType.TOKEN,
    coinGeckoId: "dogecoin",
    fallbackPrice: "0.11",
  },
];

export async function getActiveAssets(): Promise<AssetDto[]> {
  const assets = await prisma.asset.findMany({
    where: { isActive: true },
    orderBy: { symbol: "asc" },
  });

  return assets.map((a) => {
    const meta = SUPPORTED_ASSETS.find((sa) => sa.symbol === a.symbol);
    return {
      id: a.id,
      symbol: a.symbol,
      name: a.name,
      decimals: a.decimals,
      type: a.type,
      isActive: a.isActive,
      coinGeckoId: meta?.coinGeckoId,
      fallbackPrice: meta?.fallbackPrice,
    };
  });
}
