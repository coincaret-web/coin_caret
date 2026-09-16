import React from "react";
import { ExplorerNavbar } from "@/components/explorer/ExplorerNavbar";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Footer } from "@/components/marketing/Footer";

export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      <ExplorerNavbar />
      <main className="flex-1 py-8 sm:py-10">
        <LayoutContainer>{children}</LayoutContainer>
      </main>
      <Footer />
    </div>
  );
}
