import React from "react";
import { userManagementService } from "@/modules/admin/service/user-management.service";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { Users, Search, ChevronLeft, ChevronRight, UserCheck, Clock, ShieldOff } from "lucide-react";
import Link from "next/link";

interface AdminUsersPageProps {
  searchParams?: {
    q?: string;
    page?: string;
  };
}

export const metadata = {
  title: "Registered Users & Compliance | Admin Command Center",
  description: "View, search, and manage registered client accounts, roles, and KYC identity verification states.",
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const q = searchParams?.q || "";
  const pageParam = parseInt(searchParams?.page || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = 20;
  const skip = (page - 1) * limit;

  const { users, total, totalPages } = await userManagementService.getAllUsersWithKycStatus({
    search: q,
    skip,
    take: limit,
  });

  const verifiedCount = users.filter((u) => u.kycStatus === "APPROVED").length;
  const pendingCount = users.filter((u) => u.kycStatus === "PENDING_REVIEW" || u.kycStatus === "SUBMITTED").length;
  const exemptCount = users.filter((u) => u.kycRequired === false).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Registered Users & Compliance</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Platform account registry, role-based governance, and real-time KYC verification status
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total Accounts: <strong className="text-white">{total}</strong>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">KYC Verified</div>
            <div className="text-xl font-bold text-white">{verifiedCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Pending Review</div>
            <div className="text-xl font-bold text-white">{pendingCount}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <ShieldOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">KYC Exempt (Demo/VIP)</div>
            <div className="text-xl font-bold text-white">{exemptCount}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form method="GET" action="/admin/users" className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search users by name or email address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </form>

        {q && (
          <Link
            href="/admin/users"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 self-center"
          >
            Clear Filter &times;
          </Link>
        )}
      </div>

      {/* Users Table */}
      <AdminUsersTable users={users} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400 font-mono">
          <div>
            Showing page <span className="text-white font-bold">{page}</span> of{" "}
            <span className="text-white font-bold">{totalPages}</span> ({total} total users)
          </div>

          <div className="flex items-center space-x-2">
            {page > 1 ? (
              <Link
                href={`/admin/users?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </span>
            )}

            {page < totalPages ? (
              <Link
                href={`/admin/users?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-600 cursor-not-allowed">
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
