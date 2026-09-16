import { prisma } from "@/lib/prisma";
import { FileText, ShieldCheck, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Trail | Coin Caret Admin",
  description: "Cryptographic, immutable ledger of all administrator and system actions.",
};

export default async function AdminAuditLogsPage() {
  const auditLogs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      actorUser: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Immutable Audit Trail</h1>
            <p className="text-xs text-slate-400 font-mono">
              Tamper-evident logs of administrative actions, config mutations, and treasury mints
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 uppercase">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Entity</th>
                <th className="py-3.5 px-4 font-semibold">Actor</th>
                <th className="py-3.5 px-4 font-semibold">IP Address</th>
                <th className="py-3.5 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {log.actorUser?.email || "SYSTEM_DAEMON"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.afterState || log.beforeState || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
