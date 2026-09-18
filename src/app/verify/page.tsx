"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { DocumentUploadZone } from "@/components/kyc/DocumentUploadZone";
import { KycDocumentType, KycVerificationStatus } from "@prisma/client";

export default function KycVerifyPage() {
  const router = useRouter();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<KycVerificationStatus | "NOT_SUBMITTED">("NOT_SUBMITTED");
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);

  // Form states
  const [ssn, setSsn] = useState("");
  const [ssnCard, setSsnCard] = useState<File | null>(null);
  const [federalId, setFederalId] = useState<File | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchKycStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/kyc/status");
      if (res.status === 401) {
        router.push("/login?callbackUrl=/verify");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setReviewNotes(data.reviewNotes || null);
      }
    } catch (err) {
      console.error("Failed to load KYC status:", err);
    } finally {
      setLoadingStatus(false);
    }
  }, [router]);

  useEffect(() => {
    fetchKycStatus();
  }, [fetchKycStatus]);

  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format SSN as XXX-XX-XXXX
    const raw = e.target.value.replace(/\D/g, "").slice(0, 9);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setSsn(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!ssn || ssn.replace(/\D/g, "").length !== 9) {
      setFormError("Please enter a complete 9-digit Social Security Number (XXX-XX-XXXX).");
      return;
    }

    if (!ssnCard || !federalId || !drivingLicense) {
      setFormError("All 3 identity documents (SSN Card, Federal ID, and Driver's License) are required.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("ssn", ssn);
      formData.append("ssnCard", ssnCard);
      formData.append("federalId", federalId);
      formData.append("drivingLicense", drivingLicense);

      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to submit verification documents.");
        setSubmitting(false);
        return;
      }

      setStatus(data.status);
      if (data.status === "APPROVED") {
        setSuccessMsg("Identity verification approved! You now have full access to your crypto wallet.");
      } else {
        setSuccessMsg("Your documents have been submitted and are currently under compliance review.");
      }
    } catch (err: any) {
      setFormError("An unexpected error occurred during submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm text-slate-400 font-medium">Checking compliance & verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] py-12 px-4 sm:px-6 relative selection:bg-amber-500 selection:text-slate-950">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            <span>Institutional Compliance Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Identity & Regulatory Verification
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            To satisfy financial regulation and activate ledger transactions, please verify your identity with government-issued documentation.
          </p>
        </div>

        {/* ── STATE: APPROVED ── */}
        {status === "APPROVED" && (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Identity Verified & Approved</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Your KYC compliance documents have been verified. Your account has unrestricted access to send, receive, swap, and withdraw across all assets.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/wallet"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>Proceed to Wallet Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE: PENDING_REVIEW ── */}
        {status === "PENDING_REVIEW" && (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Documents Under Compliance Review</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Your submission has been securely encrypted with AES-256 and queued for manual compliance inspection. You will receive notification as soon as verification completes.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-left space-y-2 max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>Submitted Documents (Encrypted at Rest):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Social Security Number Card (SSN)</li>
                <li>Federal Government ID / Passport</li>
                <li>State Driver&apos;s License</li>
              </ul>
            </div>
            <button
              onClick={fetchKycStatus}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Review Status</span>
            </button>
          </div>
        )}

        {/* ── STATE: NOT_SUBMITTED OR REJECTED ── */}
        {(status === "NOT_SUBMITTED" || status === "REJECTED") && (
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl shadow-2xl space-y-8">
            {status === "REJECTED" && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Previous Submission Rejected</p>
                  <p className="text-xs text-rose-300/80 mt-1">
                    {reviewNotes || "Compliance team requested re-upload with clearer documentation."}
                  </p>
                </div>
              </div>
            )}

            {formError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: SSN Number */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Social Security Number (SSN) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={ssn}
                    onChange={handleSsnChange}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 tracking-widest font-mono transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hardware-level AES-256-GCM encryption before database persistence</span>
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-6 space-y-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mandatory Document Verification (3 Slots)
                </h3>

                {/* Section 2: SSN Card */}
                <DocumentUploadZone
                  label="1. Social Security Card"
                  description="Upload full physical SSN card image or scan (front side)"
                  documentType={KycDocumentType.SSN_CARD}
                  selectedFile={ssnCard}
                  onFileSelected={setSsnCard}
                />

                {/* Section 3: Federal ID */}
                <DocumentUploadZone
                  label="2. Federal Government ID / Passport"
                  description="Upload valid Passport, Military ID, or Federal Credential"
                  documentType={KycDocumentType.FEDERAL_ID}
                  selectedFile={federalId}
                  onFileSelected={setFederalId}
                />

                {/* Section 4: Driving License */}
                <DocumentUploadZone
                  label="3. State Driver's License"
                  description="Upload current, non-expired State Driver's License (front)"
                  documentType={KycDocumentType.DRIVING_LICENSE}
                  selectedFile={drivingLicense}
                  onFileSelected={setDrivingLicense}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Uploading KYC Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Verification Documents</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
