"use client";

import React from "react";
import { ArrowRight, X, ShieldCheck, Loader2, ArrowLeftRight, Sparkles } from "lucide-react";

interface SwapReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  networkFee: string;
  totalDebit: string;
  isCustomAdminRate?: boolean;
  isLoading: boolean;
}

export function SwapReviewModal({
  isOpen,
  onClose,
  onConfirm,
  fromSymbol,
  toSymbol,
  fromAmount,
  toAmount,
  exchangeRate,
  networkFee,
  totalDebit,
  isCustomAdminRate,
  isLoading,
}: SwapReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Review Cross-Asset Swap
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Atomic dual-leg settlement across double-entry ledgers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Swap Visualizer */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">You Pay</span>
              <div className="text-lg font-mono font-bold text-white">{fromAmount} <span className="text-cyan-400">{fromSymbol}</span></div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="text-right space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">You Receive</span>
              <div className="text-lg font-mono font-bold text-emerald-400">{toAmount} <span className="text-emerald-300">{toSymbol}</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Conversion Rate</span>
              <span className="text-slate-200 font-bold">1 {fromSymbol} = {exchangeRate} {toSymbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pricing Oracle</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isCustomAdminRate ? "Institutional Direct Rate" : "CoinGecko Market Bridge"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network Gas Fee</span>
              <span className="text-slate-300">{networkFee} {fromSymbol}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Total Deducted</span>
              <span className="font-black text-rose-400">{totalDebit} {fromSymbol}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/30 flex items-start gap-2.5 text-xs text-cyan-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Dual-leg atomic settlement: funds are swapped instantly and verified with 3-tier block confirmations.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-1/3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Atomic Swap...</span>
              </>
            ) : (
              <>
                <span>Confirm & Execute Swap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
