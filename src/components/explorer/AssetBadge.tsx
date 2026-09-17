import React from "react";

interface Props {
  symbol: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AssetBadge({ symbol, size = "sm", className = "" }: Props) {
  const sym = (symbol || "CC").toUpperCase();

  const colorMap: Record<string, string> = {
    CC: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    BTC: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ETH: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    SOL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    BNB: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    LTC: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    XRP: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    DOGE: "bg-amber-600/10 text-amber-300 border-amber-600/20",
  };

  const colorClasses = colorMap[sym] || "bg-slate-800 text-slate-300 border-slate-700";

  const sizeClasses =
    size === "lg"
      ? "px-3 py-1 text-xs font-bold"
      : size === "md"
      ? "px-2.5 py-0.5 text-xs font-semibold"
      : "px-2 py-0.5 text-[10px] font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono tracking-wider ${colorClasses} ${sizeClasses} ${className}`}
    >
      {sym}
    </span>
  );
}
