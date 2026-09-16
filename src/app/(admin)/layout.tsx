import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export const metadata = {
  title: "Admin Command Center | Coin Caret",
  description: "Institutional back-office administration and real-time blockchain network controls.",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const userRole = (session.user as any)?.role || "USER";
  const allowedRoles = ["PLATFORM_OWNER", "OPERATIONS_ADMIN", "FINANCE_OPERATOR", "AUDITOR"];

  if (!allowedRoles.includes(userRole)) {
    redirect("/wallet");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
