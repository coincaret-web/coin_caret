import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kycService } from "@/modules/kyc/service/kyc.service";

export async function GET(req: Request) {
  try {
    let userId = req.headers.get("x-user-id");

    if (!userId) {
      try {
        const session = await getServerSession(authOptions);
        userId = (session?.user as any)?.id;
      } catch {
        // Ignored if outside Next.js request async storage context
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to check KYC status." },
        { status: 401 }
      );
    }

    const status = await kycService.getVerificationStatus(userId);

    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve KYC status." },
      { status: 500 }
    );
  }
}
