"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  UserCheck,
  Lock,
} from "lucide-react";

interface Props {
  initialKycRequired: boolean;
  initialKycReviewMode: "automatic" | "manual";
}

export function KycConfigPanel({ initialKycRequired, initialKycReviewMode }: Props) {
  const [kycRequired, setKycRequired] = useState<boolean>(initialKycRequired);
  const [reviewMode, setReviewMode] = useState<"automatic" | "manual">(initialKycReviewMode);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      // 1. Update KYC_REQUIRED
      const res1 = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "KYC_REQUIRED",
          value: kycRequired ? "true" : "false",
        }),
      });
      const data1 = await res1.json();
      if (!res1.ok) {
        throw new Error(data1.error || "Failed to update KYC_REQUIRED configuration.");
      }

      // 2. Update KYC_REVIEW_MODE
      const res2 = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "KYC_REVIEW_MODE",
          value: reviewMode,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) {
        throw new Error(data2.error || "Failed to update KYC_REVIEW_MODE configuration.");
      }

      setStatusMessage({
        type: "success",
        text: `Compliance controls updated: KYC Enforcement is ${kycRequired ? "ACTIVE" : "DISABLED"}, Review Mode is set to ${reviewMode.toUpperCase()}.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred while saving compliance settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">KYC & Compliance Governance Controls</h2>
          <p className="text-xs text-slate-400 font-mono">
            Platform-wide identity verification requirements, document upload gates, and review policies
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle 1: KYC_REQUIRED */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Platform-Wide KYC Enforcement</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  kycRequired
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {kycRequired ? "Enforced" : "Permissive / Disabled"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When enabled, all users must complete identity verification (SSN + ID docs) before accessing web wallet operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setKycRequired(!kycRequired)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              kycRequired
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-slate-800"
            }`}
          >
            {kycRequired ? (
              <>
                <ToggleRight className="w-5 h-5 text-amber-400" />
                <span>KYC Required: ON</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-slate-500" />
                <span>KYC Required: OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Toggle 2: KYC_REVIEW_MODE */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Document Review Pipeline Mode</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  reviewMode === "manual"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {reviewMode === "manual" ? "Manual Desk Review" : "Automatic Approval"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              In <strong className="text-slate-300">Automatic</strong> mode, submissions are instantly approved. In <strong className="text-slate-300">Manual</strong> mode, submissions enter Pending Review until audited by an admin.
            </p>
          </div>

          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setReviewMode("automatic")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                reviewMode === "automatic"
                  ? "bg-emerald-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => setReviewMode("manual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                reviewMode === "manual"
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Manual Review
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Compliance Parameters...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Compliance Controls</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
