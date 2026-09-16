import { getNetworkConfig } from "@/modules/admin/service/network-config.service";
import { NetworkControlForm } from "@/components/admin/NetworkControlForm";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live Network Controls | Coin Caret Admin",
  description: "Configure blockchain engine block intervals, transfer fees, and emergency pause controls.",
};

export default async function AdminNetworkPage() {
  const settings = await getNetworkConfig();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Live Network Controls</h1>
            <p className="text-xs text-slate-400 font-mono">
              Dynamic consensus parameters & worker cycle configuration
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Form Component */}
      <NetworkControlForm initialSettings={settings} />

      {/* Architecture Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/60 text-xs font-mono text-slate-400 space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
          <Cpu className="w-4 h-4" />
          <span>Autonomous Block Generator Engine</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Parameter updates are written directly to the high-performance <code className="text-slate-300">network_settings</code> table and monitored adaptively by the background block generator worker. All modifications trigger an immutable cryptographic entry in the <code className="text-slate-300">audit_logs</code> table.
        </p>
      </div>
    </div>
  );
}
