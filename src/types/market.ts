export type SupportedCoinId =
  | "bitcoin"
  | "ethereum"
  | "solana"
  | "binancecoin"
  | "litecoin"
  | "ripple"
  | "dogecoin";

export interface CoinPriceEntry {
  coinId: SupportedCoinId;
  symbol: string;
  name: string;
  usdPrice: string;
  fetchedAt: string;
}

export type CoinPriceMap = Record<SupportedCoinId, CoinPriceEntry>;

export interface CryptoPricesResponse {
  prices: CoinPriceMap;
  fetchedAt: string;
  isStale: boolean;
}

export interface CryptoConversionResult {
  coinId: SupportedCoinId;
  symbol: string;
  name: string;
  usdPrice: string;
  equivalentAmount: string;
  iconUrl?: string;
}
