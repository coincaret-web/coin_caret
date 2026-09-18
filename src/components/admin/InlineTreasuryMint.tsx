"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUserWallet } from "@/types/user";
import { Coins, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface InlineTreasuryMintProps {
  userId: string;
  wallets: AdminUserWallet[];
}

export function InlineTreasuryMint({ userId, wallets }: InlineTreasuryMintProps) {
  const router = useRouter();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    wallets[0]?.id || ""
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedWallet) {
      setErrorMessage("Please select a target asset wallet.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid positive issuance amount.");
      return;
    }

    if (!reason || reason.trim().length < 3) {
      setErrorMessage("Please provide an issuance reason (minimum 3 characters).");
      return;
    }

    setIsMinting(true);

    try {
      const res = await fetch("/api/admin/treasury/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientWalletId: selectedWallet.id,
          assetSymbol: selectedWallet.assetSymbol,
          amount,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mint treasury assets.");
      }

      setSuccessMessage(
        `Successfully issued ${amount} ${selectedWallet.assetSymbol} to client wallet.`
      );
      setAmount("");
      setReason("");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during issuance.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Direct Treasury Asset Allocation</h3>
          <p className="text-xs text-slate-400 font-mono">
            Scoped institutional minting directly into user&apos;s provisioned multi-currency wallets
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Asset Selection Grid (8 Tiles) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Select Target Currency Tile (8 Assets)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {wallets.map((w) => {
            const isSelected = w.id === selectedWallet?.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWalletId(w.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 relative ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{w.assetSymbol}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{w.assetName}</div>
                <div className="text-[11px] font-mono text-slate-300 font-semibold mt-1 truncate">
                  {w.availableBalance}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Issuance Form */}
      <form onSubmit={handleMint} className="space-y-4 pt-2 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Issuance Amount ({selectedWallet?.assetSymbol || "CC"})
            </label>
            <input
              type="text"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500.00"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Audit Reason Code
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Institutional Client Demo Allocation"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isMinting}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isMinting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Issuing Ledger Entry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                Issue {amount ? `${amount} ${selectedWallet?.assetSymbol}` : "Assets"} to Client
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
