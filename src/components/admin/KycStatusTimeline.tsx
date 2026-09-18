import React from "react";
import { KycVerificationStatus } from "@prisma/client";
import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react";

interface KycStatusTimelineProps {
  status: KycVerificationStatus | "NOT_SUBMITTED";
  kycRequired: boolean;
}

export function KycStatusTimeline({ status, kycRequired }: KycStatusTimelineProps) {
  const steps = [
    {
      title: "1. Account Registration",
      desc: "Full contact profile & contact details registered",
      state: "completed",
    },
    {
      title: "2. Document & SSN Intake",
      desc: "SSN encrypted with AES-256 & 3 ID credentials stored",
      state:
        status === "NOT_SUBMITTED"
          ? kycRequired
            ? "waiting"
            : "exempt"
          : "completed",
    },
    {
      title: "3. Compliance Audit Review",
      desc:
        status === "APPROVED"
          ? "Identity verified and approved by compliance desk"
          : status === "REJECTED"
          ? "Submission rejected by compliance desk"
          : status === "PENDING_REVIEW" || status === "SUBMITTED"
          ? "Currently queued for manual compliance inspection"
          : "Awaiting document intake",
      state:
        status === "APPROVED"
          ? "completed"
          : status === "REJECTED"
          ? "rejected"
          : status === "PENDING_REVIEW" || status === "SUBMITTED"
          ? "active"
          : "waiting",
    },
    {
      title: "4. Full Multi-Asset Settlement",
      desc:
        status === "APPROVED" || !kycRequired
          ? "Unrestricted multi-currency wallet transfers & trading active"
          : "Transfers locked until verification clears",
      state: status === "APPROVED" || !kycRequired ? "completed" : "waiting",
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
          Identity Compliance Lifecycle
        </h3>
        <span className="text-xs font-mono text-slate-400">
          State: <strong className="text-cyan-400">{status}</strong>
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start space-x-3 text-xs">
            <div className="mt-0.5 shrink-0">
              {step.state === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : step.state === "active" ? (
                <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
              ) : step.state === "rejected" ? (
                <XCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="space-y-0.5">
              <div
                className={`font-semibold ${
                  step.state === "completed"
                    ? "text-slate-200"
                    : step.state === "active"
                    ? "text-cyan-300"
                    : step.state === "rejected"
                    ? "text-rose-300"
                    : "text-slate-500"
                }`}
              >
                {step.title}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
