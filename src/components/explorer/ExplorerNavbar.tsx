"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Blocks, ArrowLeftRight, Activity, Wallet, Compass } from "lucide-react";

export function ExplorerNavbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Overview", href: "/explorer", icon: Compass },
    { label: "Web Wallet", href: "/wallet", icon: Wallet },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#070A0F]/90 backdrop-blur-xl sticky top-0 z-50">
      <LayoutContainer className="h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/explorer" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-cyan-500/20 text-xl tracking-wider group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  COIN CARET
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
                  Explorer
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CC Mainnet Engine (10s Cadence)</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </LayoutContainer>
    </header>
  );
}
