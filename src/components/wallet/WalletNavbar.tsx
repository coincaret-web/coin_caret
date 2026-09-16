"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  LogOut,
  User,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

interface WalletNavbarProps {
  primaryAddress?: string;
}

export function WalletNavbar({ primaryAddress }: WalletNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (primaryAddress) {
      navigator.clipboard.writeText(primaryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { label: "Dashboard", href: "/wallet", icon: Wallet },
    { label: "Send CC", href: "/wallet/send", icon: ArrowUpRight },
    { label: "Receive CC", href: "/wallet/receive", icon: ArrowDownLeft },
    { label: "Withdrawals", href: "/wallet/withdraw", icon: Clock },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-xl sticky top-0 z-40">
      <LayoutContainer className="h-20 flex items-center justify-between gap-4">
        {/* Brand & Address Pill */}
        <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
          <Link href="/wallet" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 text-xl tracking-wider group-hover:scale-105 transition-transform shrink-0">
              CC
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white hidden sm:inline-block">
              COIN CARET
            </span>
          </Link>

          {primaryAddress && (
            <button
              onClick={handleCopy}
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors group shrink-0"
              title="Click to copy primary address"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{primaryAddress.slice(0, 8)}...{primaryAddress.slice(-6)}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
              )}
            </button>
          )}
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 shrink-0">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <Link
            href="/explorer"
            className="hidden sm:flex items-center space-x-1 text-xs font-medium text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>

          <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-800 shrink-0">
            {session?.user && (
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-white">{session.user.name || "Institutional User"}</span>
                <span className="text-[10px] text-slate-500 font-mono">{session.user.email}</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
              {session?.user?.name ? session.user.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </LayoutContainer>
    </header>
  );
}
