"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

export default function WithdrawPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const bridgeFee = "0.50000000";
  const numAmount = parseFloat(amount || "0");
  const numFee = parseFloat(bridgeFee);
  const numTotal = numAmount > 0 ? numAmount + numFee : 0;
  const numAvailable = parseFloat(summary?.availableBalance || "0");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/wallet/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleMaxClick = () => {
    const maxWithdraw = Math.max(0, numAvailable - numFee);
    setAmount(maxWithdraw.toFixed(8));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (numAmount <= 0) {
      setError("Please enter a valid positive withdrawal amount.");
      setSubmitting(false);
      return;
    }

    if (numTotal > numAvailable) {
      setError(`Insufficient available balance. Withdrawal amount (${numAmount} CC) + Bridge Fee (${bridgeFee} CC) exceeds available ${summary?.availableBalance} CC.`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationAddress: destinationAddress.trim(),
          amount: numAmount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit withdrawal request.");
        setSubmitting(false);
        return;
      }

      setSuccessData(data);
      setSubmitting(false);
    } catch (err: any) {
      setError("An unexpected network error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading withdrawal parameters...</p>
      </div>
    );
  }

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
        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
          Institutional Settlement
        </span>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Institutional CC Withdrawal
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          Bridge CC assets to external institutional addresses with multi-sig auditing.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successData ? (
          <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Withdrawal Request Submitted</h3>
            <p className="text-xs text-slate-400">
              Funds reserved in audit queue. Status: <span className="text-emerald-400 font-bold">{successData.status}</span>
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 break-all">
              Request ID: {successData.withdrawalId}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                External Settlement Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Withdrawal Amount
                </label>
                <div className="text-xs text-slate-400">
                  Available: <span className="font-mono text-emerald-400">{summary?.availableBalance} CC</span>
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

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Protocol Bridge & Audit Fee</span>
                <span className="font-mono">{bridgeFee} CC</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-semibold text-white">
                <span>Total Debit from Available Balance</span>
                <span className="font-mono text-emerald-400">{numTotal.toFixed(8)} CC</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <span>Submit Institutional Withdrawal</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
