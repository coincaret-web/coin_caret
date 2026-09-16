import { findAllCachedPrices, upsertPriceFeedCache } from "../repository/price-feed.repository";
import { SupportedCoinId, CoinPriceMap, CryptoConversionResult } from "@/types/market";
import { Decimal } from "@prisma/client/runtime/library";

export const SUPPORTED_COINS: { id: SupportedCoinId; symbol: string; name: string; fallbackPrice: string }[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", fallbackPrice: "65000.00" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", fallbackPrice: "3400.00" },
  { id: "solana", symbol: "SOL", name: "Solana", fallbackPrice: "145.00" },
  { id: "binancecoin", symbol: "BNB", name: "BNB", fallbackPrice: "560.00" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", fallbackPrice: "68.00" },
  { id: "ripple", symbol: "XRP", name: "XRP", fallbackPrice: "0.58" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", fallbackPrice: "0.11" },
];

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function getOrRefreshCryptoPrices(): Promise<{
  prices: CoinPriceMap;
  fetchedAt: string;
  isStale: boolean;
}> {
  const cachedRows = await findAllCachedPrices();
  const now = Date.now();

  const isCacheValid =
    cachedRows.length === SUPPORTED_COINS.length &&
    cachedRows.every((row) => now - new Date(row.fetchedAt).getTime() < CACHE_TTL_MS);

  if (isCacheValid) {
    const priceMap: any = {};
    for (const row of cachedRows) {
      priceMap[row.coinId] = {
        coinId: row.coinId as SupportedCoinId,
        symbol: row.symbol,
        name: row.name,
        usdPrice: row.usdPrice.toFixed(2),
        fetchedAt: row.fetchedAt.toISOString(),
      };
    }
    return {
      prices: priceMap as CoinPriceMap,
      fetchedAt: cachedRows[0]?.fetchedAt.toISOString() || new Date().toISOString(),
      isStale: false,
    };
  }

  // Attempt live refresh from CoinGecko public API
  try {
    const ids = SUPPORTED_COINS.map((c) => c.id).join(",");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const priceMap: any = {};

      for (const coin of SUPPORTED_COINS) {
        const liveUsd = data[coin.id]?.usd;
        const finalPrice = liveUsd && liveUsd > 0 ? String(liveUsd) : coin.fallbackPrice;

        const updatedRow = await upsertPriceFeedCache({
          coinId: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          usdPrice: finalPrice,
        });

        priceMap[coin.id] = {
          coinId: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          usdPrice: updatedRow.usdPrice.toFixed(2),
          fetchedAt: updatedRow.fetchedAt.toISOString(),
        };
      }

      return {
        prices: priceMap as CoinPriceMap,
        fetchedAt: new Date().toISOString(),
        isStale: false,
      };
    }
  } catch (err) {
    console.warn("[Price Feed] External CoinGecko API request failed or timed out. Falling back to cached/seed values.", err);
  }

  // Fallback: Populate or return existing cache rows / seeds
  const priceMap: any = {};
  for (const coin of SUPPORTED_COINS) {
    const existing = cachedRows.find((r) => r.coinId === coin.id);
    if (existing) {
      priceMap[coin.id] = {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        usdPrice: existing.usdPrice.toFixed(2),
        fetchedAt: existing.fetchedAt.toISOString(),
      };
    } else {
      const created = await upsertPriceFeedCache({
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        usdPrice: coin.fallbackPrice,
      });
      priceMap[coin.id] = {
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        usdPrice: created.usdPrice.toFixed(2),
        fetchedAt: created.fetchedAt.toISOString(),
      };
    }
  }

  return {
    prices: priceMap as CoinPriceMap,
    fetchedAt: new Date().toISOString(),
    isStale: true,
  };
}

export function computeCryptoConversions(
  ccAmount: string,
  ccUsdRate: string,
  prices: CoinPriceMap
): CryptoConversionResult[] {
  let ccDec: Decimal;
  let rateDec: Decimal;

  try {
    ccDec = new Decimal(ccAmount || "0");
    rateDec = new Decimal(ccUsdRate || "0.25");
  } catch {
    ccDec = new Decimal(0);
    rateDec = new Decimal("0.25");
  }

  if (ccDec.lte(0) || rateDec.lte(0)) {
    return SUPPORTED_COINS.map((c) => ({
      coinId: c.id,
      symbol: c.symbol,
      name: c.name,
      usdPrice: prices[c.id]?.usdPrice || c.fallbackPrice,
      equivalentAmount: "0.00000000",
    }));
  }

  const totalUsdValue = ccDec.times(rateDec);

  return SUPPORTED_COINS.map((c) => {
    const priceEntry = prices[c.id];
    const usdPriceDec = new Decimal(priceEntry?.usdPrice || c.fallbackPrice);

    let equivalentAmount = "0.00000000";
    if (usdPriceDec.gt(0)) {
      equivalentAmount = totalUsdValue.div(usdPriceDec).toFixed(8);
    }

    return {
      coinId: c.id,
      symbol: c.symbol,
      name: c.name,
      usdPrice: usdPriceDec.toFixed(2),
      equivalentAmount,
    };
  });
}
