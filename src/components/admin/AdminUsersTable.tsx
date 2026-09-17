import React from "react";
import Link from "next/link";
import { AdminUserListItem } from "@/types/user";
import { KycStatusBadge } from "./KycStatusBadge";
import { User, Phone, ArrowUpRight, Shield } from "lucide-react";

interface AdminUsersTableProps {
  users: AdminUserListItem[];
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
        <User className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
        <p className="text-sm font-medium">No registered users found.</p>
        <p className="text-xs text-slate-500 font-mono">Try adjusting your search criteria or pagination.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <th className="py-3.5 px-4 font-semibold">User / Identity</th>
            <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Contact Phone</th>
            <th className="py-3.5 px-4 font-semibold hidden lg:table-cell">Role</th>
            <th className="py-3.5 px-4 font-semibold">Account Status</th>
            <th className="py-3.5 px-4 font-semibold">KYC Status</th>
            <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Registered</th>
            <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
          {users.map((user) => {
            const dateFormatted = new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <tr
                key={user.id}
                className="hover:bg-slate-800/30 transition-colors duration-150 group"
              >
                {/* User column */}
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm shadow-cyan-500/10">
                      {user.displayName?.slice(0, 2).toUpperCase() || "CC"}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                        {user.displayName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Phone number */}
                <td className="py-4 px-4 hidden md:table-cell font-mono text-slate-300">
                  {user.phoneNumber ? (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{user.phoneNumber}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Not provided</span>
                  )}
                </td>

                {/* Role */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Shield className="w-3 h-3 text-indigo-400" />
                    <span>{user.roles?.[0] || "USER"}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      user.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : user.status === "SUSPENDED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                {/* KYC Status Badge */}
                <td className="py-4 px-4">
                  <KycStatusBadge
                    status={user.kycStatus}
                    kycRequired={user.kycRequired}
                  />
                </td>

                {/* Registration Date */}
                <td className="py-4 px-4 hidden sm:table-cell font-mono text-slate-400">
                  {dateFormatted}
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-slate-950 text-xs font-semibold transition-all duration-150 shadow-sm"
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
