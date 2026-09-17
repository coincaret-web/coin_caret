"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  Coins, 
  Settings, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  ArrowLeftRight
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Command Overview",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Live Network Controls",
      href: "/admin/network",
      icon: Activity,
      active: pathname === "/admin/network",
    },
    {
      label: "Treasury Issuance",
      href: "/admin/treasury",
      icon: Coins,
      active: pathname === "/admin/treasury",
    },
    {
      label: "Exchange Rates",
      href: "/admin/exchange-rates",
      icon: ArrowLeftRight,
      active: pathname === "/admin/exchange-rates",
    },
    {
      label: "Platform Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
    {
      label: "Audit Trail",
      href: "/admin/audit-logs",
      icon: FileText,
      active: pathname === "/admin/audit-logs",
    },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col justify-between p-4 backdrop-blur-xl shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-wider text-white flex items-center gap-1.5">
              <span>COIN CARET</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono tracking-tight">Mainnet Command Center</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${item.active ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.active && <ChevronRight className="w-4 h-4 text-cyan-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation Links */}
      <div className="pt-4 border-t border-slate-800/60 space-y-2">
        <Link
          href="/wallet"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
        >
          <span>Return to Web Wallet</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </Link>
        <Link
          href="/explorer"
          className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
        >
          <span>Live Block Explorer</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>
    </aside>
  );
}
