"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Menu, X, ArrowUpRight, ShieldCheck } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-xl sticky top-0 z-50">
      <LayoutContainer className="h-20 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20 text-xl tracking-wider group-hover:scale-105 transition-transform">
            CC
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              COIN CARET
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mainnet
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <Link href="/explorer" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            Block Explorer
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
          <a href="#features" className="hover:text-emerald-400 transition-colors">
            Capabilities
          </a>
          <a href="#architecture" className="hover:text-emerald-400 transition-colors">
            Architecture
          </a>
          <a href="#security" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Security & Invariants
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/wallet"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            Launch App
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </LayoutContainer>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-6 py-6 space-y-4 backdrop-blur-2xl">
          <Link
            href="/explorer"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-200 hover:text-emerald-400"
          >
            Block Explorer
          </Link>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-200 hover:text-emerald-400"
          >
            Capabilities
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-200 hover:text-emerald-400"
          >
            Architecture
          </a>
          <a
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-200 hover:text-emerald-400"
          >
            Security & Invariants
          </a>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-slate-800 text-slate-200 font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
            >
              Launch CC App
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
