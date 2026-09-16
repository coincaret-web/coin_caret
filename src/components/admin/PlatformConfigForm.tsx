"use client";

import { useState } from "react";
import { 
  DollarSign, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Coins,
  Calculator
} from "lucide-react";

interface Props {
  initialRate: string;
  updatedAt: string;
}

export function PlatformConfigForm({ initialRate, updatedAt }: Props) {
  const [rate, setRate] = useState(initialRate);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const presets = ["0.10", "0.25", "0.50", "1.00", "2.50"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "CC_USD_RATE",
          value: rate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update valuation rate.");
      }

      setStatusMessage({
        type: "success",
        text: `Authoritative CC/USD valuation rate updated to $${data.config.value} USD.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sample5000Valuation = (5000 * (parseFloat(rate) || 0)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/20">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Authoritative CC/USD Equivalence Rate</h2>
          <p className="text-xs text-slate-400 font-mono">
            Governs client portfolio USD representations across all web wallet interfaces
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>USD Equivalence Per 1.00000000 CC</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-sm font-mono text-slate-400">$</span>
            <input
              type="text"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.25"
              required
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50"
            />
            <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">USD</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRate(preset)}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-mono text-slate-300 transition-colors"
              >
                ${preset} USD
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Client Wallet Dashboard Simulation</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">User Balance: 5,000.00000000 CC</span>
            <span className="text-emerald-400 font-bold">≈ ${sample5000Valuation} USD</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Updating Valuation & Writing Audit Log...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish CC/USD Rate</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
