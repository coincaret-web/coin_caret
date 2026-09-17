import { AssetType } from "@prisma/client";

export interface AssetDto {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  type: AssetType;
  isActive: boolean;
  coinGeckoId?: string;
  fallbackPrice?: string;
}

export interface SupportedAssetDefinition {
  symbol: string;
  name: string;
  decimals: number;
  type: AssetType;
  coinGeckoId?: string;
  fallbackPrice?: string;
}
