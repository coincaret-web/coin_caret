import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kycGateService } from "@/modules/kyc/service/kyc-gate.service";

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = req.headers.get("x-user-id");

    if (!userId) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          userId = (session.user as any).id;
        }
      } catch {
        // test scope fallback
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: authentication required." },
        { status: 401 }
      );
    }

    const accessStatus = await kycGateService.getAccessStatus(userId);
    return NextResponse.json({ accessStatus }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to determine KYC gate status." },
      { status: 500 }
    );
  }
}
