"use client";

import { useState, useEffect } from "react";
import { 
  Calculator, 
  RefreshCw, 
  Coins, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { CoinPriceMap, CryptoConversionResult, SupportedCoinId } from "@/types/market";

interface Props {
  initialCcAmount?: string;
}

const COIN_METADATA: Record<SupportedCoinId, { bgGradient: string; textColor: string }> = {
  bitcoin: { bgGradient: "from-amber-500/20 to-orange-500/10", textColor: "text-amber-400" },
  ethereum: { bgGradient: "from-indigo-500/20 to-purple-500/10", textColor: "text-indigo-400" },
  solana: { bgGradient: "from-purple-500/20 to-pink-500/10", textColor: "text-purple-400" },
  binancecoin: { bgGradient: "from-yellow-500/20 to-amber-500/10", textColor: "text-yellow-400" },
  litecoin: { bgGradient: "from-slate-500/20 to-blue-500/10", textColor: "text-slate-300" },
  ripple: { bgGradient: "from-cyan-500/20 to-blue-500/10", textColor: "text-cyan-400" },
  dogecoin: { bgGradient: "from-amber-600/20 to-yellow-500/10", textColor: "text-amber-300" },
};

export function CryptoConversionCalculator({ initialCcAmount = "1000.00000000" }: Props) {
  const [ccAmount, setCcAmount] = useState(initialCcAmount);
  const [ccUsdRate, setCcUsdRate] = useState("0.25");
  const [prices, setPrices] = useState<CoinPriceMap | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [rateRes, pricesRes] = await Promise.all([
        fetch("/api/platform/cc-usd-rate"),
        fetch("/api/platform/crypto-prices"),
      ]);

      if (rateRes.ok) {
        const rateData = await rateRes.json();
        setCcUsdRate(rateData.rate || "0.25");
      }

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData.prices);
        setIsStale(pricesData.isStale || false);
        setLastFetched(new Date(pricesData.fetchedAt));
      }
    } catch (err) {
      console.error("Failed to load conversion calculator data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 60s auto refresh
    return () => clearInterval(interval);
  }, []);

  const totalUsdValue = (parseFloat(ccAmount || "0") * parseFloat(ccUsdRate || "0.25")).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getConversions = (): CryptoConversionResult[] => {
    if (!prices) return [];
    const amountNum = parseFloat(ccAmount || "0");
    const rateNum = parseFloat(ccUsdRate || "0.25");
    const totalUsd = amountNum * rateNum;

    return Object.values(prices).map((p) => {
      const coinUsdPrice = parseFloat(p.usdPrice) || 1;
      const equivalent = amountNum > 0 && coinUsdPrice > 0 ? (totalUsd / coinUsdPrice).toFixed(8) : "0.00000000";
      return {
        coinId: p.coinId,
        symbol: p.symbol,
        name: p.name,
        usdPrice: coinUsdPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        equivalentAmount: equivalent,
      };
    });
  };

  const conversions = getConversions();

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cryptocurrency Valuation Calculator</span>
              {isStale && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Cached
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live multi-asset equivalence powered by CoinGecko market pricing
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 text-xs font-mono text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Input Control & Valuation Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/60">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calculate CC Amount</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={ccAmount}
              onChange={(e) => setCcAmount(e.target.value)}
              placeholder="1000.00"
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-mono text-cyan-400 font-bold">CC</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Authoritative Rate:</span>
            <span className="text-emerald-400 font-bold">${ccUsdRate} USD / CC</span>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-1 md:border-l md:border-slate-800/60 md:pl-6">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Holding USD Value
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
            <span className="text-emerald-400 font-bold">${totalUsdValue}</span>
            <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {lastFetched ? `Price index: ${lastFetched.toLocaleTimeString()}` : "Fetching rates..."}
          </div>
        </div>
      </div>

      {/* Crypto Equivalents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {conversions.map((coin) => {
          const meta = COIN_METADATA[coin.coinId] || { bgGradient: "from-slate-800/40 to-slate-900/40", textColor: "text-white" };
          return (
            <div
              key={coin.coinId}
              className={`p-4 rounded-2xl bg-gradient-to-br ${meta.bgGradient} border border-slate-800/80 space-y-3 hover:border-slate-700/80 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{coin.name}</span>
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 ${meta.textColor}`}>
                      {coin.symbol}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    ${coin.usdPrice}
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800/40">
                <div className="text-[10px] uppercase font-mono text-slate-400">Equivalent</div>
                <div className="text-base sm:text-lg font-black font-mono text-white truncate">
                  {coin.equivalentAmount} <span className={`text-xs ${meta.textColor}`}>{coin.symbol}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attribution & Institutional Note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs font-mono text-slate-500">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Conversion estimates reflect live market prices bridged via the authoritative CC/USD rate.</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <span>Market data index via</span>
          <span className="text-cyan-400 font-semibold">CoinGecko API</span>
        </div>
      </div>
    </div>
  );
}
