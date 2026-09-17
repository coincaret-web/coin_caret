"use client";

import React, { useState } from "react";
import { 
  PortfolioAssetMetric 
} from "@/modules/wallets/service/portfolio.service";
import { AssetBalanceCard } from "./AssetBalanceCard";
import { PortfolioAssetAllocation } from "./PortfolioAssetAllocation";
import { 
  ShieldCheck, 
  Search, 
  SlidersHorizontal,
  Sparkles,
  ArrowLeftRight,
  TrendingUp,
  Coins
} from "lucide-react";
import Link from "next/link";

interface PortfolioDashboardProps {
  assets: PortfolioAssetMetric[];
  totalPortfolioUsdValue: string;
  isStale?: boolean;
}

export function PortfolioDashboard({
  assets,
  totalPortfolioUsdValue,
  isStale,
}: PortfolioDashboardProps) {
  const [filterType, setFilterType] = useState<"ALL" | "NATIVE" | "TOKEN">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssets = assets.filter((asset) => {
    const matchesFilter =
      filterType === "ALL"
        ? true
        : filterType === "NATIVE"
        ? asset.symbol === "CC"
        : asset.symbol !== "CC";

    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.name && asset.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* 1. Global Multi-Asset Net Worth Hero Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950/90 border border-cyan-500/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Currency Institutional Portfolio</span>
              {isStale && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                  Cached Pricing
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-medium mb-1">Total Net Worth</div>
            <div className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
              <span>${parseFloat(totalPortfolioUsdValue || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-lg sm:text-2xl font-bold text-cyan-400 font-sans">USD</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-mono">
              Consolidated across 8 authoritative multi-currency blockchain vaults
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/wallet/swap"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 hover:scale-[1.02]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Instant Cross-Asset Swap</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Visual Allocation Bar & Stats */}
      <PortfolioAssetAllocation
        assets={assets}
        totalUsdValue={totalPortfolioUsdValue}
      />

      {/* 3. Multi-Asset Vault Grid Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Cryptocurrency Vaults ({filteredAssets.length})
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full sm:w-48 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-medium">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === "ALL"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All (8)
              </button>
              <button
                onClick={() => setFilterType("NATIVE")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === "NATIVE"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Native
              </button>
              <button
                onClick={() => setFilterType("TOKEN")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === "TOKEN"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tokens (7)
              </button>
            </div>
          </div>
        </div>

        {/* Asset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <AssetBalanceCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      </div>
    </div>
  );
}
