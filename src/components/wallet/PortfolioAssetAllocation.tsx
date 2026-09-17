"use client";

import React from "react";
import { PortfolioAssetMetric } from "@/modules/wallets/service/portfolio.service";
import { PieChart } from "lucide-react";

const ASSET_COLORS: Record<string, string> = {
  CC: "bg-emerald-400",
  BTC: "bg-amber-400",
  ETH: "bg-indigo-400",
  SOL: "bg-fuchsia-400",
  BNB: "bg-yellow-400",
  LTC: "bg-slate-400",
  XRP: "bg-cyan-400",
  DOGE: "bg-amber-600",
};

interface PortfolioAssetAllocationProps {
  assets: PortfolioAssetMetric[];
  totalUsdValue: string;
}

export function PortfolioAssetAllocation({
  assets,
  totalUsdValue,
}: PortfolioAssetAllocationProps) {
  const activeAssets = assets.filter((a) => parseFloat(a.allocationPercentage) > 0);

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Portfolio Allocation</h3>
            <p className="text-xs text-slate-400 font-mono">Real-time asset distribution breakdown</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 font-mono">Total Valuation</span>
          <div className="text-lg font-mono font-black text-emerald-400">
            ${parseFloat(totalUsdValue || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>
      </div>

      {/* Allocation Stack Bar */}
      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
        {activeAssets.length === 0 ? (
          <div className="w-full h-full bg-slate-800" />
        ) : (
          activeAssets.map((asset) => (
            <div
              key={asset.symbol}
              style={{ width: `${asset.allocationPercentage}%` }}
              className={`h-full ${ASSET_COLORS[asset.symbol] || "bg-cyan-500"} transition-all duration-500`}
              title={`${asset.symbol}: ${asset.allocationPercentage}% ($${asset.usdValue})`}
            />
          ))
        )}
      </div>

      {/* Asset Allocation Legend Badges */}
      <div className="flex flex-wrap items-center gap-3">
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
          >
            <span
              className={`w-2 h-2 rounded-full ${ASSET_COLORS[asset.symbol] || "bg-cyan-400"}`}
            />
            <span className="font-bold text-white">{asset.symbol}</span>
            <span className="text-slate-400">{asset.allocationPercentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
