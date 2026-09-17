import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { getWalletBalance } from "@/modules/ledger/service/ledger.service";
import { getCcUsdRate } from "@/modules/admin/service/platform-config.service";
import { getOrRefreshCryptoPrices, SUPPORTED_COINS } from "@/modules/market/service/price-feed.service";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

export interface PortfolioAssetInput {
  symbol: string;
  totalBalance: string;
  usdPrice: string;
  availableBalance?: string;
  reservedBalance?: string;
  walletId?: string;
  name?: string;
  address?: string;
  type?: string;
}

export interface PortfolioAssetMetric extends PortfolioAssetInput {
  usdValue: string;
  allocationPercentage: string;
}

export interface PortfolioMetricsResult {
  totalPortfolioUsdValue: string;
  assets: PortfolioAssetMetric[];
}

export function computePortfolioMetrics(
  assets: PortfolioAssetInput[]
): PortfolioMetricsResult {
  let totalUsdDec = new Decimal(0);

  const assetValues = assets.map((asset) => {
    let balanceDec: Decimal;
    let priceDec: Decimal;

    try {
      balanceDec = new Decimal(asset.totalBalance || "0");
      priceDec = new Decimal(asset.usdPrice || "0");
    } catch {
      balanceDec = new Decimal(0);
      priceDec = new Decimal(0);
    }

    const usdVal = balanceDec.times(priceDec);
    totalUsdDec = totalUsdDec.plus(usdVal);

    return {
      ...asset,
      usdVal,
    };
  });

  const processedAssets: PortfolioAssetMetric[] = assetValues.map((item) => {
    let allocPct = "0.00";
    if (totalUsdDec.gt(0)) {
      allocPct = item.usdVal
        .dividedBy(totalUsdDec)
        .times(100)
        .toFixed(2);
    }

    const { usdVal, ...rest } = item;
    return {
      ...rest,
      usdValue: usdVal.toFixed(2),
      allocationPercentage: allocPct,
    };
  });

  return {
    totalPortfolioUsdValue: totalUsdDec.toFixed(2),
    assets: processedAssets,
  };
}

export async function getUserPortfolioSummary(userId: string): Promise<{
  totalPortfolioUsdValue: string;
  assets: PortfolioAssetMetric[];
  isStale: boolean;
  fetchedAt: string;
}> {
  const [userWallets, ccRateData, cryptoPricesData] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId },
      include: { addresses: true, asset: true },
      orderBy: { createdAt: "asc" },
    }),
    getCcUsdRate(),
    getOrRefreshCryptoPrices(),
  ]);

  if (!userWallets || userWallets.length === 0) {
    return {
      totalPortfolioUsdValue: "0.00",
      assets: [],
      isStale: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  const rawAssetList: PortfolioAssetInput[] = [];

  for (const wallet of userWallets) {
    const balances = await getWalletBalance(wallet.id);
    const sym = wallet.asset.symbol.toUpperCase();

    let usdPrice = "1.00";
    if (sym === "CC") {
      usdPrice = ccRateData.rate || "0.25";
    } else {
      const coinDef = SUPPORTED_COINS.find((c) => c.symbol.toUpperCase() === sym);
      if (coinDef && cryptoPricesData.prices[coinDef.id]) {
        usdPrice = cryptoPricesData.prices[coinDef.id].usdPrice || coinDef.fallbackPrice;
      } else {
        const fallbackDef = SUPPORTED_ASSETS.find((a) => a.symbol.toUpperCase() === sym);
        usdPrice = fallbackDef?.fallbackPrice || "1.00";
      }
    }

    rawAssetList.push({
      walletId: wallet.id,
      symbol: sym,
      name: wallet.asset.name,
      type: wallet.asset.type,
      address: wallet.addresses[0]?.address ?? "",
      availableBalance: balances.available.toFixed(8),
      reservedBalance: balances.reserved.toFixed(8),
      totalBalance: balances.total.toFixed(8),
      usdPrice,
    });
  }

  const metrics = computePortfolioMetrics(rawAssetList);

  return {
    totalPortfolioUsdValue: metrics.totalPortfolioUsdValue,
    assets: metrics.assets,
    isStale: cryptoPricesData.isStale,
    fetchedAt: cryptoPricesData.fetchedAt,
  };
}
