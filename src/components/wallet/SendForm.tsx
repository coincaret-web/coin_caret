"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SendReviewModal } from "./SendReviewModal";
import { validateAddressChecksum } from "@/modules/wallets/service/address.service";
import { ArrowLeft, ArrowUpRight, AlertCircle, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export interface SendWalletOption {
  symbol: string;
  name: string;
  address?: string;
  walletId?: string;
  availableBalance: string;
  networkFee?: string;
}

interface SendFormProps {
  availableBalance: string;
  senderAddress: string;
  assetSymbol?: string;
  assetName?: string;
  walletId?: string;
  networkFee?: string;
  wallets?: SendWalletOption[];
  onSelectAsset?: (symbol: string) => void;
}

export function SendForm({
  availableBalance,
  senderAddress,
  assetSymbol = "CC",
  assetName = "Coin Caret",
  walletId,
  networkFee: propFee,
  wallets,
  onSelectAsset,
}: SendFormProps) {
  const router = useRouter();


  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const sym = assetSymbol.toUpperCase();
  const networkFee = propFee || "0.50000000";
  const numAmount = parseFloat(amount || "0");
  const numFee = parseFloat(networkFee);
  const numTotal = numAmount > 0 ? numAmount + numFee : 0;
  const numAvailable = parseFloat(availableBalance || "0");

  const handleMaxClick = () => {
    const maxSend = Math.max(0, numAvailable - numFee);
    setAmount(maxSend.toFixed(8));
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate address format & checksum
    if (!validateAddressChecksum(toAddress.trim())) {
      setError("Invalid Coin Caret recipient address checksum. Must start with CC0x followed by 40 hex characters.");
      return;
    }

    if (toAddress.trim().toLowerCase() === senderAddress.toLowerCase()) {
      setError("Sender and recipient addresses cannot be identical.");
      return;
    }

    // 2. Validate amount & fee
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive transfer amount.");
      return;
    }

    if (numTotal > numAvailable) {
      setError(`Insufficient available balance. Transfer amount (${numAmount} ${sym}) + Gas Fee (${networkFee} ${sym}) exceeds available ${availableBalance} ${sym}.`);
      return;
    }

    setIsReviewOpen(true);
  };

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    setError(null);

    try {
      const idempotencyKey = `send-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      const res = await fetch("/api/wallet/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          toAddress: toAddress.trim(),
          amount: parseFloat(amount),
          assetSymbol: sym,
          ...(walletId ? { fromWalletId: walletId } : {}),
          note: `Direct ${sym} Wallet Transfer`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Transfer failed. Please check mempool status.");
        setIsReviewOpen(false);
        setIsBroadcasting(false);
        return;
      }

      setSuccessTxHash(data.txHash);
      setIsReviewOpen(false);
      setIsBroadcasting(false);
    } catch (err: any) {
      setError("Failed to broadcast transaction over network. Please try again.");
      setIsReviewOpen(false);
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Mempool Ready
        </span>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Send {assetName} ({sym})
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          Transfer {sym} instantly with deterministic 10-second block finality.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successTxHash ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Transaction Broadcast to Mempool!</h3>
            <p className="text-xs text-slate-400">
              Funds locked in 1/3 confirmation state. Assigned to next 10-second block.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 break-all">
              Tx Hash: {successTxHash}
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/wallet"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOpenReview} className="space-y-6">
            {/* Asset Selector */}
            {wallets && wallets.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Asset to Transfer
                </label>
                <div className="relative">
                  <select
                    value={sym}
                    onChange={(e) => onSelectAsset?.(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
                  >
                    {wallets.map((w) => (
                      <option key={w.symbol} value={w.symbol} className="bg-slate-900 text-white">
                        {w.symbol} — {w.name} (Available: {parseFloat(w.availableBalance).toFixed(4)} {w.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Recipient Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recipient Cryptographic Address
              </label>
              <input
                type="text"
                required
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder={`${sym}0x...`}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Format: {sym}0x + 40 hex characters with SHA-256 checksum
              </span>
            </div>


            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transfer Amount
                </label>
                <div className="text-xs text-slate-400">
                  Available: <span className="font-mono text-emerald-400">{availableBalance} {sym}</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.00000001"
                  min="0.00000001"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00000000"
                  className="w-full pl-4 pr-16 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Gas Fee & Net Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Network Gas Fee</span>
                </span>
                <span className="font-mono">{networkFee} {sym}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-semibold text-white">
                <span>Estimated Total Debit</span>
                <span className="font-mono text-emerald-400">{numTotal.toFixed(8)} {sym}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              <span>Review Transaction</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <SendReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleBroadcast}
        recipientAddress={toAddress}
        amount={numAmount.toFixed(8)}
        networkFee={networkFee}
        totalDebit={numTotal.toFixed(8)}
        assetSymbol={sym}
        isLoading={isBroadcasting}
      />
    </div>
  );
}
