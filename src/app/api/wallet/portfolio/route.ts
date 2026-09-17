import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserPortfolioSummary } from "@/modules/wallets/service/portfolio.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const portfolio = await getUserPortfolioSummary(userId);

    return NextResponse.json({ success: true, portfolio }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve portfolio summary" },
      { status: 500 }
    );
  }
}
