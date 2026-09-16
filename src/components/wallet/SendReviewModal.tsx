"use client";

import React from "react";
import { ShieldCheck, ArrowRight, X, AlertCircle, Loader2, Scale } from "lucide-react";

interface SendReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipientAddress: string;
  amount: string;
  networkFee: string;
  totalDebit: string;
  isLoading: boolean;
}

export function SendReviewModal({
  isOpen,
  onClose,
  onConfirm,
  recipientAddress,
  amount,
  networkFee,
  totalDebit,
  isLoading,
}: SendReviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Review Transaction
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Breakdown */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Recipient Cryptographic Address
            </span>
            <span className="font-mono text-xs sm:text-sm text-emerald-400 font-bold break-all">
              {recipientAddress}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Transfer Amount</span>
              <span className="font-mono font-bold text-white text-sm">{amount} CC</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Network Gas Fee</span>
              <span className="font-mono text-slate-300">{networkFee} CC</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
              <span className="font-semibold text-white">Total Ledger Debit</span>
              <span className="font-mono font-black text-emerald-400 text-base">{totalDebit} CC</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Funds will be atomically locked in Mempool and settled across 3 confirmation blocks.</span>
          </div>
        </div>

        {/* Action Controls */}
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
            className="w-full sm:w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting to Mempool...</span>
              </>
            ) : (
              <>
                <span>Confirm & Broadcast Transaction</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
