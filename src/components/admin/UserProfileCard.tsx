"use client";

import React, { useState } from "react";
import { AdminUserDetail } from "@/types/user";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface UserProfileCardProps {
  user: AdminUserDetail;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const [kycRequired, setKycRequired] = useState(user.kycRequired);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleSuccess, setToggleSuccess] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleToggleKyc = async () => {
    setIsToggling(true);
    setToggleSuccess(null);
    setToggleError(null);

    const nextValue = !kycRequired;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/kyc-toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kycRequired: nextValue }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update KYC override.");
      }

      setKycRequired(nextValue);
      setToggleSuccess(
        nextValue
          ? "KYC Requirement is now ENFORCED for this user."
          : "KYC Requirement is now EXEMPT / BYPASSED for this user."
      );
    } catch (err: any) {
      setToggleError(err.message || "An error occurred while toggling KYC override.");
    } finally {
      setIsToggling(false);
    }
  };

  const createdFormatted = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Top Identity Block */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            {user.displayName?.slice(0, 2).toUpperCase() || "CC"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {user.roles?.[0] || "USER"}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  user.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {user.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px]">
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Email Address</span>
          </div>
          <div className="text-slate-200 font-semibold truncate">{user.email}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px]">
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contact Phone</span>
          </div>
          <div className="text-slate-200 font-semibold">
            {user.phoneNumber || <span className="text-slate-500 italic">Not provided</span>}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px]">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Physical Address</span>
          </div>
          <div className="text-slate-200 font-sans text-xs">
            {user.address || <span className="text-slate-500 italic">Not provided</span>}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px]">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Registration Timestamp</span>
          </div>
          <div className="text-slate-200 font-semibold">{createdFormatted}</div>
        </div>
      </div>

      {/* KYC Override Toggle */}
      <div className="border-t border-slate-800/80 pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              {kycRequired ? (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span>Per-User KYC Requirement Override</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {kycRequired
                ? "User must upload and pass identity verification before accessing wallet functions."
                : "User is exempt from KYC identity verification gates (VIP / Demo override)."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleKyc}
            disabled={isToggling}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              kycRequired
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
            }`}
          >
            {isToggling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : kycRequired ? (
              <>
                <ToggleRight className="w-4 h-4 text-amber-400" />
                <span>Enforced (ON)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-emerald-400" />
                <span>Exempt (OFF)</span>
              </>
            )}
          </button>
        </div>

        {toggleSuccess && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{toggleSuccess}</span>
          </p>
        )}

        {toggleError && (
          <p className="text-xs text-rose-400 font-mono">{toggleError}</p>
        )}
      </div>
    </div>
  );
}
