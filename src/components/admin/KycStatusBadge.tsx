import React from "react";
import { KycVerificationStatus } from "@prisma/client";
import { CheckCircle2, Clock, XCircle, AlertCircle, ShieldOff } from "lucide-react";

interface KycStatusBadgeProps {
  status: KycVerificationStatus | "NOT_SUBMITTED";
  kycRequired?: boolean;
}

export function KycStatusBadge({ status, kycRequired = true }: KycStatusBadgeProps) {
  if (kycRequired === false) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <ShieldOff className="w-3 h-3 text-slate-500" />
        <span>KYC Off (Exempt)</span>
      </span>
    );
  }

  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Verified & Approved</span>
        </span>
      );

    case "PENDING_REVIEW":
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Pending Review</span>
        </span>
      );

    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>Rejected</span>
        </span>
      );

    case "NOT_SUBMITTED":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span>Not Submitted</span>
        </span>
      );
  }
}
