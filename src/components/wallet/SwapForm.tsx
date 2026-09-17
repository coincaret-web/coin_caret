"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  ArrowDownUp, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Wallet,
  ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SwapReviewModal } from "./SwapReviewModal";

interface AssetOption {
  symbol: string;
  name: string;
  availableBalance: string;
}

interface SwapFormProps {
  userAssets: AssetOption[];
}

export function SwapForm({ userAssets }: SwapFormProps) {
  const router = useRouter();

  const [fromSymbol, setFromSymbol] = useState("CC");
  const [toSymbol, setToSymbol] = useState("BTC");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("0.00000000");
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  const fromAsset = userAssets.find((a) => a.symbol === fromSymbol) || {
    symbol: fromSymbol,
    name: fromSymbol,
    availableBalance: "0.00000000",
  };

  const toAsset = userAssets.find((a) => a.symbol === toSymbol) || {
    symbol: toSymbol,
    name: toSymbol,
    availableBalance: "0.00000000",
  };

  // Fetch live quote with debouncing
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromSymbol === toSymbol) {
      setToAmount("0.00000000");
      setQuoteData(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoadingQuote(true);
      setErrorMessage(null);

      try {
        const res = await fetch(
          `/api/wallet/swap?from=${fromSymbol}&to=${toSymbol}&amount=${fromAmount}`
        );
        const data = await res.json();

        if (isMounted) {
          if (res.ok && data.success) {
            setQuoteData(data.quote);
            setToAmount(data.quote.toAmount);
          } else {
            setErrorMessage(data.error || "Failed to calculate quote");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Network error fetching quote");
        }
      } finally {
        if (isMounted) setIsLoadingQuote(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fromSymbol, toSymbol, fromAmount]);

  const handleFlipPair = () => {
    const tempFrom = fromSymbol;
    setFromSymbol(toSymbol);
    setToSymbol(tempFrom);
    setFromAmount("");
    setToAmount("0.00000000");
    setQuoteData(null);
  };

  const handleMaxAmount = () => {
    const avail = parseFloat(fromAsset.availableBalance) || 0;
    if (avail > 0) {
      // Small buffer for fee
      const feeEstimate = fromSymbol === "CC" ? 0.5 : 0.0001;
      const maxSendable = Math.max(0, avail - feeEstimate);
      setFromAmount(maxSendable.toFixed(8));
    }
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const amountNum = parseFloat(fromAmount);
    const availNum = parseFloat(fromAsset.availableBalance);

    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Please enter a valid swap amount greater than zero.");
      return;
    }

    if (amountNum > availNum) {
      setErrorMessage(
        `Insufficient ${fromSymbol} balance. Available: ${fromAsset.availableBalance} ${fromSymbol}`
      );
      return;
    }

    if (!quoteData) {
      setErrorMessage("Please wait for exchange rate quote to load.");
      return;
    }

    setIsReviewOpen(true);
  };

  const handleExecuteSwap = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/wallet/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromSymbol,
          toSymbol,
          amount: fromAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Swap execution failed.");
      }

      setSuccessResult(data);
      setIsReviewOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during swap.");
      setIsReviewOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Trade Settled Successfully!</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Atomic swap executed and ledger verified across 3 block confirmations
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs font-mono text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Swapped:</span>
            <span className="text-white font-bold">{successResult.fromAmount} {successResult.fromSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Received:</span>
            <span className="text-emerald-400 font-bold">{successResult.toAmount} {successResult.toSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Rate:</span>
            <span className="text-slate-300">1 {successResult.fromSymbol} = {successResult.rate} {successResult.toSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Network Gas Fee:</span>
            <span className="text-slate-400">{successResult.fee} {successResult.fromSymbol}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setSuccessResult(null);
              setFromAmount("");
              setToAmount("0.00000000");
              setQuoteData(null);
            }}
            className="w-1/2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Swap Again
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="w-1/2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            Return to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Instant Cross-Asset Swap</h2>
              <p className="text-xs text-slate-400 font-mono">Zero slippage internal multi-asset liquidity</p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleReview} className="space-y-4">
          {/* Source Asset Input */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">You Pay</span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Wallet className="w-3.5 h-3.5" />
                <span>Available: {parseFloat(fromAsset.availableBalance).toFixed(4)} {fromSymbol}</span>
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent text-xl sm:text-2xl font-mono font-bold text-white focus:outline-none placeholder:text-slate-600"
              />
              <select
                value={fromSymbol}
                onChange={(e) => setFromSymbol(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500 shrink-0"
              >
                {userAssets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Flip Pair Divider Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleFlipPair}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 shadow-md transition-transform hover:rotate-180 duration-300"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* Target Asset Output */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">You Receive (Estimated)</span>
              <div className="flex items-center gap-1 text-slate-400">
                <span>Balance: {parseFloat(toAsset.availableBalance).toFixed(4)} {toSymbol}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full text-xl sm:text-2xl font-mono font-bold text-emerald-400 flex items-center">
                {isLoadingQuote ? (
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    Calculating quote...
                  </span>
                ) : (
                  toAmount
                )}
              </div>
              <select
                value={toSymbol}
                onChange={(e) => setToSymbol(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500 shrink-0"
              >
                {userAssets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Rate Preview Card */}
          {quoteData && (
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Exchange Rate</span>
                <span className="font-bold">1 {fromSymbol} = {quoteData.rate} {toSymbol}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Gas Network Fee</span>
                <span>{quoteData.fee} {fromSymbol}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!fromAmount || parseFloat(fromAmount) <= 0 || fromSymbol === toSymbol || isLoadingQuote}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>Review Swap</span>
          </button>
        </form>
      </div>

      <SwapReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleExecuteSwap}
        fromSymbol={fromSymbol}
        toSymbol={toSymbol}
        fromAmount={fromAmount}
        toAmount={toAmount}
        exchangeRate={quoteData?.rate || "1.00000000"}
        networkFee={quoteData?.fee || "0.00000000"}
        totalDebit={quoteData?.totalDebit || fromAmount}
        isCustomAdminRate={quoteData?.isCustomAdminRate}
        isLoading={isSubmitting}
      />
    </div>
  );
}
