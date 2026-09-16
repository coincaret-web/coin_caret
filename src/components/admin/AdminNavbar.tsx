"use client";

import { useSession, signOut } from "next-auth/react";
import { Shield, LogOut, Radio, User } from "lucide-react";

export function AdminNavbar() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userEmail = session?.user?.email || "admin@coincaret.com";

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NETWORK ONLINE</span>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>127.0.0.1:3847</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {userRole.slice(0, 2)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-slate-200">{userEmail}</div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{userRole}</div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
