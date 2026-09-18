"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KycVerificationStatus } from "@prisma/client";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

interface KycReviewPanelProps {
  userId: string;
  status: KycVerificationStatus | "NOT_SUBMITTED";
  initialNotes?: string | null;
}

export function KycReviewPanel({ userId, status, initialNotes }: KycReviewPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (status !== "PENDING_REVIEW" && status !== "SUBMITTED") {
    return null;
  }

  const handleReviewAction = async (action: "APPROVE" | "REJECT") => {
    setActionError(null);
    setActionSuccess(null);

    if (action === "REJECT" && (!notes || notes.trim().length < 5)) {
      setActionError("Please provide a rejection reason (minimum 5 characters) for the user.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}/kyc-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: notes.trim() || (action === "APPROVE" ? "Identity verified by compliance audit." : "Rejection notes"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit KYC review decision.");
      }

      setActionSuccess(
        action === "APPROVE"
          ? "KYC Verification successfully APPROVED. User now has full access to wallet operations."
          : "KYC Verification REJECTED. Rejection reason has been logged for user re-submission."
      );
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "An unexpected error occurred during review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-5 ring-1 ring-cyan-500/20">
      <div className="flex items-center space-x-2.5 border-b border-slate-800/80 pb-4">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Compliance Audit Review Desk</h3>
          <p className="text-xs text-slate-400 font-mono">
            Audit submitted identity credentials and issue binding approval or rejection decision
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Audit Notes & Compliance Feedback
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter compliance review notes or rejection feedback (e.g. 'SSN and Federal Passport verified against state record')..."
          className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleReviewAction("APPROVE")}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Verification & Unlock Wallet</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleReviewAction("REJECT")}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all disabled:opacity-50"
        >
          {submitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Reject Submission (Request Re-Upload)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
