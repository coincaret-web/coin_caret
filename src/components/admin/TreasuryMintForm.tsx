"use client";

import { useState } from "react";
import { 
  Coins, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck, 
  FileSignature, 
  ShieldCheck,
  Building2
} from "lucide-react";

export interface WalletOption {
  id: string;
  label: string;
  address: string;
  userEmail: string;
  userName: string;
  assetSymbol: string;
  assetName: string;
}

interface Props {
  wallets: WalletOption[];
}

export function TreasuryMintForm({ wallets }: Props) {
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || "");
  const [amount, setAmount] = useState("1000.00000000");
  const [reason, setReason] = useState("Client Demo Onboarding Grant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
    txHash?: string;
  } | null>(null);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const activeSymbol = selectedWallet?.assetSymbol || "CC";

  const presets = ["100.00000000", "500.00000000", "1000.00000000", "5000.00000000"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/treasury/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientWalletId: selectedWalletId,
          amount,
          reason,
          assetSymbol: activeSymbol,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mint treasury asset.");
      }

      setStatusMessage({
        type: "success",
        text: `Successfully minted ${Number(amount).toLocaleString()} ${activeSymbol} to client wallet.`,
        txHash: data.txHash,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred during issuance.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Direct Treasury Minting & Issuance</h2>
          <p className="text-xs text-slate-400 font-mono">
            Atomically debits SYSTEM_TREASURY and credits recipient AVAILABLE account
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex flex-col space-y-1 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.txHash && (
            <div className="text-xs font-mono text-emerald-400/80 pl-7">
              Tx Hash: {statusMessage.txHash}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recipient Wallet Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Recipient Account & Asset</span>
          </label>
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                [{w.assetSymbol}] {w.userName} ({w.userEmail}) — {w.address.slice(0, 10)}...{w.address.slice(-6)}
              </option>
            ))}
          </select>
          {selectedWallet && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs font-mono text-slate-400 flex justify-between items-center">
              <span>Verified Address ({selectedWallet.assetSymbol}):</span>
              <span className="text-cyan-400 font-bold">{selectedWallet.address}</span>
            </div>
          )}
        </div>

        {/* Issuance Amount */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Issuance Amount ({activeSymbol})</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000.00000000"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">{activeSymbol}</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
              >
                +{Number(preset).toLocaleString()} {activeSymbol}
              </button>
            ))}
          </div>
        </div>

        {/* Mandatory Reason Code */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileSignature className="w-3.5 h-3.5 text-indigo-400" />
            <span>Audit Reason & Memo (Mandatory)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Institutional Liquidity Allocation"
            required
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedWalletId}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Minting & Posting to Double-Entry Ledger...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Execute Atomic Treasury Mint</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
