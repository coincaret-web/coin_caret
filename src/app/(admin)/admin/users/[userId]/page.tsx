import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { userManagementService } from "@/modules/admin/service/user-management.service";
import { UserProfileCard } from "@/components/admin/UserProfileCard";
import { KycStatusTimeline } from "@/components/admin/KycStatusTimeline";
import { KycDocumentViewer } from "@/components/admin/KycDocumentViewer";
import { KycReviewPanel } from "@/components/admin/KycReviewPanel";
import { InlineTreasuryMint } from "@/components/admin/InlineTreasuryMint";
import { UserWalletsList } from "@/components/admin/UserWalletsList";
import { ArrowLeft, Shield, User } from "lucide-react";

interface AdminUserDetailPageProps {
  params: {
    userId: string;
  };
}

export const metadata = {
  title: "Client User Profile & KYC Review | Admin Command Center",
  description: "Granular profile inspection, identity verification review, and scoped treasury asset allocation.",
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = params;

  const user = await userManagementService.getUserWithVerification(userId);

  if (!user) {
    notFound();
  }

  const kycStatus = user.verification?.status || "NOT_SUBMITTED";

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center space-x-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registered Users Registry</span>
        </Link>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">User ID:</span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            {user.id}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Identity & KYC (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          <UserProfileCard user={user} />
          <KycStatusTimeline status={kycStatus} kycRequired={user.kycRequired} />
          <KycDocumentViewer documents={user.verification?.documents} />
          <KycReviewPanel
            userId={user.id}
            status={kycStatus}
            initialNotes={user.verification?.reviewNotes}
          />
        </div>

        {/* Right Column: Treasury Minting & Wallets (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          <InlineTreasuryMint userId={user.id} wallets={user.wallets || []} />
          <UserWalletsList wallets={user.wallets || []} />
        </div>
      </div>
    </div>
  );
}
