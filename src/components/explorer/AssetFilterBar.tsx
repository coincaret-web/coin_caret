"use client";

import React from "react";
import { Filter } from "lucide-react";

interface Props {
  selectedAsset: string;
  onSelectAsset: (asset: string) => void;
  className?: string;
}

const SUPPORTED_ASSET_OPTIONS = [
  { symbol: "", label: "All Assets" },
  { symbol: "CC", label: "CC" },
  { symbol: "BTC", label: "BTC" },
  { symbol: "ETH", label: "ETH" },
  { symbol: "SOL", label: "SOL" },
  { symbol: "BNB", label: "BNB" },
  { symbol: "LTC", label: "LTC" },
  { symbol: "XRP", label: "XRP" },
  { symbol: "DOGE", label: "DOGE" },
];

export function AssetFilterBar({ selectedAsset, onSelectAsset, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      <div className="flex items-center text-xs font-mono text-slate-500 mr-1.5 shrink-0">
        <Filter className="w-3.5 h-3.5 mr-1" />
        <span>Filter:</span>
      </div>
      {SUPPORTED_ASSET_OPTIONS.map((opt) => {
        const isSelected = selectedAsset.toUpperCase() === opt.symbol.toUpperCase();
        return (
          <button
            key={opt.symbol || "ALL"}
            type="button"
            onClick={() => onSelectAsset(opt.symbol)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 border ${
              isSelected
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400 font-bold shadow-sm shadow-cyan-500/20"
                : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
