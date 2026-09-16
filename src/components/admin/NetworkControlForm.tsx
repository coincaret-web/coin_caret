"use client";

import { useState } from "react";
import { 
  Activity, 
  Clock, 
  Fuel, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  PauseCircle,
  PlayCircle
} from "lucide-react";

interface NetworkSettingsData {
  blockIntervalMs: number;
  standardFeeCc: string;
  isNetworkPaused: boolean;
  requiredConfirmations: number;
}

interface Props {
  initialSettings: NetworkSettingsData;
}

export function NetworkControlForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<NetworkSettingsData>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/admin/network", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockIntervalMs: Number(settings.blockIntervalMs),
          standardFeeCc: settings.standardFeeCc,
          isNetworkPaused: settings.isNetworkPaused,
          requiredConfirmations: Number(settings.requiredConfirmations),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update network settings.");
      }

      setSettings(data.settings);
      setStatusMessage({ type: "success", text: "Network parameters successfully applied and broadcast to worker." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Emergency Status Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        settings.isNetworkPaused 
          ? "bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/50" 
          : "bg-slate-900/40 border-slate-800"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {settings.isNetworkPaused ? (
              <PauseCircle className="w-6 h-6 text-rose-400 shrink-0" />
            ) : (
              <PlayCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-sm font-semibold text-white">
                {settings.isNetworkPaused ? "Network Settlement Frozen" : "Network Settlement Active"}
              </div>
              <div className="text-xs text-slate-400">
                {settings.isNetworkPaused 
                  ? "Block generator worker will skip cycles until unpaused." 
                  : "Continuous 10-second block generation and confirmation progression."}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, isNetworkPaused: !prev.isNetworkPaused }))}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${
              settings.isNetworkPaused
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
            }`}
          >
            {settings.isNetworkPaused ? "Resume Network" : "Emergency Pause"}
          </button>
        </div>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Block Interval */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Block Generation Cadence</h3>
              <p className="text-xs text-slate-400">Worker ticker interval in milliseconds (1,000ms - 60,000ms)</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Target Interval:</span>
              <span className="text-cyan-400 font-bold">{settings.blockIntervalMs / 1000}s ({settings.blockIntervalMs} ms)</span>
            </div>
            <input
              type="range"
              min="1000"
              max="30000"
              step="1000"
              value={settings.blockIntervalMs}
              onChange={(e) => setSettings(prev => ({ ...prev, blockIntervalMs: Number(e.target.value) }))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1s (Ultra-fast)</span>
              <span>10s (Standard)</span>
              <span>30s (Conservative)</span>
            </div>
          </div>
        </div>

        {/* Standard Gas Fee */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Standard Network Gas Fee</h3>
              <p className="text-xs text-slate-400">Base fee deducted per standard transfer</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="relative">
              <input
                type="text"
                value={settings.standardFeeCc}
                onChange={(e) => setSettings(prev => ({ ...prev, standardFeeCc: e.target.value }))}
                placeholder="0.50000000"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">CC</span>
            </div>
            <div className="flex gap-2 pt-1">
              {["0.10000000", "0.25000000", "0.50000000", "1.00000000"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, standardFeeCc: preset }))}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] font-mono text-slate-300 transition-colors"
                >
                  {Number(preset)} CC
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Required Confirmations */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Confirmation Threshold</h3>
              <p className="text-xs text-slate-400">Confirmations before double-entry finalization</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-3 gap-3">
              {[1, 3, 6].map((conf) => (
                <button
                  key={conf}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, requiredConfirmations: conf }))}
                  className={`py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                    settings.requiredConfirmations === conf
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {conf} Block{conf > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Broadcasting Updates...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Apply Network Parameters</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
