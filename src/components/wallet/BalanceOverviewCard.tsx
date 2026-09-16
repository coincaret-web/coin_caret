import React from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface BalanceOverviewCardProps {
  availableBalance: string;
  reservedBalance: string;
  totalBalance: string;
  assetSymbol?: string;
  primaryAddress?: string;
  usdRate?: string;
}

export function BalanceOverviewCard({
  availableBalance,
  reservedBalance,
  totalBalance,
  assetSymbol = "CC",
  primaryAddress,
  usdRate = "0.25",
}: BalanceOverviewCardProps) {
  return (
    <div className="w-full space-y-6">
      {/* Main Portfolio Summary Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950/90 border border-emerald-500/20 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Institutional Portfolio Value</span>
            </div>
            <div className="text-xs text-slate-400 font-medium mb-1">Total Balance</div>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>{totalBalance}</span>
              <span className="text-lg sm:text-2xl font-bold text-emerald-400">{assetSymbol}</span>
            </div>
            {/* USD Equivalence Subtext */}
            <div className="mt-1 text-xs sm:text-sm font-mono text-emerald-400/90 flex items-center gap-1.5">
              <span>≈</span>
              <span>
                ${(parseFloat(totalBalance.replace(/,/g, "")) * (parseFloat(usdRate || "0.25"))).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[11px] text-slate-400 uppercase">USD</span>
              <span className="text-[10px] text-slate-500">(@ ${usdRate || "0.25"}/CC)</span>
            </div>
            {primaryAddress && (
              <div className="mt-3 inline-flex items-center space-x-2 text-xs text-slate-400 font-mono bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <span className="text-slate-500">Address:</span>
                <span>{primaryAddress.slice(0, 10)}...{primaryAddress.slice(-8)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/wallet/send"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02]"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send CC</span>
            </Link>
            <Link
              href="/wallet/receive"
              className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 hover:border-slate-700"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Receive CC</span>
            </Link>
            <Link
              href="/wallet/withdraw"
              className="px-5 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium text-sm transition-all"
            >
              <span>Withdraw</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Granular Ledger Sub-accounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Available Card */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available for Transfer
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {availableBalance} {assetSymbol}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Settled funds with zero pending locks
          </div>
        </div>

        {/* Reserved Pending Card */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Reserved in Mempool
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {reservedBalance} {assetSymbol}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Locked in active block assignment & confirmation
          </div>
        </div>
      </div>
    </div>
  );
}
