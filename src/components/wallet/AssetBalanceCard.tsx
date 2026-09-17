"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Coins, 
  TrendingUp,
  Lock
} from "lucide-react";
import { PortfolioAssetMetric } from "@/modules/wallets/service/portfolio.service";

const ASSET_THEMES: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  CC: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  BTC: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
  },
  ETH: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500 to-violet-500",
  },
  SOL: {
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-400",
    border: "border-fuchsia-500/20",
    gradient: "from-purple-500 to-fuchsia-500",
  },
  BNB: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    gradient: "from-yellow-500 to-amber-500",
  },
  LTC: {
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    border: "border-slate-500/20",
    gradient: "from-slate-400 to-slate-600",
  },
  XRP: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/20",
    gradient: "from-cyan-500 to-blue-500",
  },
  DOGE: {
    bg: "bg-amber-600/10",
    text: "text-amber-500",
    border: "border-amber-600/20",
    gradient: "from-amber-400 to-yellow-600",
  },
};

interface AssetBalanceCardProps {
  asset: PortfolioAssetMetric;
}

export function AssetBalanceCard({ asset }: AssetBalanceCardProps) {
  const [copied, setCopied] = useState(false);
  const theme = ASSET_THEMES[asset.symbol] || ASSET_THEMES.CC;

  const handleCopy = () => {
    if (asset.address) {
      navigator.clipboard.writeText(asset.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasReserved = parseFloat(asset.reservedBalance || "0") > 0;

  return (
    <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 backdrop-blur-xl shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between space-y-5 group">
      {/* Top Asset Identity Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.gradient} flex items-center justify-center font-black text-slate-950 text-base shadow-md`}
            >
              {asset.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-base tracking-tight">{asset.symbol}</h4>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {asset.allocationPercentage}%
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{asset.name || asset.symbol}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1 justify-end">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>${parseFloat(asset.usdPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Address Chip */}
        {asset.address && (
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="truncate pr-2">
              {asset.address.slice(0, 8)}...{asset.address.slice(-6)}
            </span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copy Address"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Center Balances & Valuation */}
      <div className="space-y-1 py-1">
        <div className="text-2xl font-black text-white font-mono tracking-tight">
          {parseFloat(asset.availableBalance || "0").toFixed(6)}{" "}
          <span className={`text-sm font-bold ${theme.text}`}>{asset.symbol}</span>
        </div>
        <div className="text-xs font-mono text-emerald-400 font-semibold">
          ≈ ${parseFloat(asset.usdValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </div>

        {hasReserved && (
          <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-amber-400/90">
            <Lock className="w-3 h-3" />
            <span>Reserved: {asset.reservedBalance} {asset.symbol}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Row */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2">
        <Link
          href={`/wallet/swap?from=${asset.symbol}`}
          className="py-2 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeftRight className="w-3 h-3" />
          <span>Swap</span>
        </Link>
        <Link
          href={`/wallet/send?asset=${asset.symbol}`}
          className="py-2 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
        >
          <ArrowUpRight className="w-3 h-3 text-emerald-400" />
          <span>Send</span>
        </Link>
        <Link
          href={`/wallet/receive?asset=${asset.symbol}`}
          className="py-2 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
        >
          <ArrowDownLeft className="w-3 h-3 text-teal-400" />
          <span>Receive</span>
        </Link>
      </div>
    </div>
  );
}
