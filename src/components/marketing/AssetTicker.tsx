"use client";

import React from "react";
import { TrendingUp, Sparkles } from "lucide-react";

export interface AssetTickerItem {
  symbol: string;
  name: string;
  usdPrice: string;
  change24h?: string;
}

interface AssetTickerProps {
  items: AssetTickerItem[];
}

export function AssetTicker({ items }: AssetTickerProps) {
  if (!items || items.length === 0) return null;

  const formatPrice = (priceStr: string) => {
    const num = parseFloat(priceStr);
    if (isNaN(num)) return `$${priceStr}`;
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full bg-slate-950/90 border-y border-slate-800/60 backdrop-blur-md py-3 overflow-hidden select-none">
      <div className="flex space-x-8 animate-marquee whitespace-nowrap">
        {/* Render twice for seamless continuous loop */}
        {[...items, ...items].map((item, idx) => (
          <div
            key={`${item.symbol}-${idx}`}
            className="inline-flex items-center space-x-3 px-3 py-1 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-cyan-500/30 transition-colors"
          >
            <span className="font-mono font-black text-white text-xs tracking-wider">
              {item.symbol}
            </span>
            <span className="font-mono font-bold text-cyan-400 text-xs">
              {formatPrice(item.usdPrice)}
            </span>
            {item.change24h && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                <TrendingUp className="w-2.5 h-2.5" />
                {item.change24h}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
