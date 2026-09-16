"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight, AlertCircle } from "lucide-react";

interface UniversalSearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function UniversalSearchBar({
  className = "",
  placeholder = "Search by Address, Tx Hash, or Block Height...",
  autoFocus = false,
}: UniversalSearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keyboard shortcut: Pressing "/" focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/explorer/search?q=${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setErrorMessage(data.error || "No matching block, transaction, or address found.");
        setIsLoading(false);
        return;
      }

      if (data.type === "tx") {
        router.push(`/explorer/tx/${data.target}`);
      } else if (data.type === "block") {
        router.push(`/explorer/block/${data.target}`);
      } else if (data.type === "address") {
        router.push(`/explorer/address/${data.target}`);
      }
    } catch (err: any) {
      setErrorMessage("Network error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors pointer-events-none">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-white placeholder-slate-500 text-sm sm:text-base transition-all outline-none shadow-xl shadow-black/40 font-mono tracking-tight"
          />

          <div className="absolute right-3 flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono">
              /
            </span>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center space-x-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="absolute -bottom-8 left-2 flex items-center space-x-1.5 text-rose-400 text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
}
