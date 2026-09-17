"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Layers,
  TrendingUp
} from "lucide-react";
import { AssetPairRateDto } from "@/types/market";

interface Props {
  initialRates: AssetPairRateDto[];
}

const ASSET_OPTIONS = [
  { symbol: "CC", name: "Coin Caret Native" },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "BNB", name: "Binance Coin" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "DOGE", name: "Dogecoin" },
];

export function ExchangeRateForm({ initialRates }: Props) {
  const [rates, setRates] = useState<AssetPairRateDto[]>(initialRates);
  const [fromSymbol, setFromSymbol] = useState("CC");
  const [toSymbol, setToSymbol] = useState("BTC");
  const [rateInput, setRateInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [liveCrossRate, setLiveCrossRate] = useState<string | null>(null);
  const [isLoadingCrossRate, setIsLoadingCrossRate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch current live cross-rate when pair changes
  useEffect(() => {
    if (fromSymbol === toSymbol) {
      setLiveCrossRate("1.00000000");
      return;
    }

    let isMounted = true;
    setIsLoadingCrossRate(true);
    fetch(`/api/platform/exchange-rates?from=${fromSymbol}&to=${toSymbol}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setLiveCrossRate(data.rate);
        }
      })
      .catch(() => {
        if (isMounted) setLiveCrossRate(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCrossRate(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromSymbol, toSymbol]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromSymbol === toSymbol) {
      setStatusMessage({
        type: "error",
        text: "Source and target assets cannot be the same.",
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/exchange-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSymbol,
          toSymbol,
          rate: rateInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update exchange rate.");
      }

      setStatusMessage({
        type: "success",
        text: `Exchange rate for ${fromSymbol} ➔ ${toSymbol} updated to ${data.rate.rate} in PostgreSQL.`,
      });

      // Refresh list
      const listRes = await fetch("/api/admin/exchange-rates");
      const listData = await listRes.json();
      if (listData.success) {
        setRates(listData.rates);
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyLiveRate = () => {
    if (liveCrossRate) {
      setRateInput(liveCrossRate);
    }
  };

  return (
    <div className="space-y-8">
      {/* Rate Configuration Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Cross-Asset Exchange Rate Matrix</h2>
            <p className="text-xs text-slate-400 font-mono">
              Configure authoritative fixed exchange rates or sync with dynamic CoinGecko market cross-rates
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-medium ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Asset */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">From Asset (Source)</label>
              <select
                value={fromSymbol}
                onChange={(e) => setFromSymbol(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
              >
                {ASSET_OPTIONS.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* To Asset */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">To Asset (Target)</label>
              <select
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
              >
                {ASSET_OPTIONS.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Market Reference Banner */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Derived CoinGecko Bridge Rate:{" "}
                <strong className="text-cyan-300 font-mono">
                  {isLoadingCrossRate ? "Calculating..." : liveCrossRate ? `1 ${fromSymbol} ≈ ${liveCrossRate} ${toSymbol}` : "N/A"}
                </strong>
              </span>
            </div>
            {liveCrossRate && (
              <button
                type="button"
                onClick={handleApplyLiveRate}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Market Rate</span>
              </button>
            )}
          </div>

          {/* Rate Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Exchange Rate (1 {fromSymbol} = ? {toSymbol})</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder={liveCrossRate || "e.g. 0.00000385"}
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">{toSymbol}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || fromSymbol === toSymbol}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing Custom Rate to PostgreSQL...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Pair Exchange Rate</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Active Custom Overrides List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Active Database Overrides ({rates.length})</h3>
        </div>

        {rates.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No manual rate overrides active. All trades currently resolve dynamically via CoinGecko bridge pricing.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {rates.map((r, idx) => (
              <div key={r.id || idx} className="py-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/20">
                    {r.fromSymbol} ➔ {r.toSymbol}
                  </span>
                  <span className="text-slate-400">1 {r.fromSymbol} =</span>
                  <span className="text-emerald-400 font-semibold">{r.rate} {r.toSymbol}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "Active"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
