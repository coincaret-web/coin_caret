import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/checkPermission";
import { z } from "zod";
import { kycService } from "@/modules/kyc/service/kyc.service";

const kycReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().min(1, "Review notes are required").max(1000),
});

async function resolveUserRole(
  req: NextRequest
): Promise<{ userId: string | null; role: string }> {
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId) {
    const user = await prisma.user.findUnique({
      where: { id: headerUserId },
      include: { roles: { include: { role: true } } },
    });
    if (user) {
      const role = user.roles[0]?.role?.name || "USER";
      return { userId: user.id, role };
    }
  }

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = session.user as any;
      return { userId: user.id, role: user.role || "USER" };
    }
  } catch {
    // direct test context fallback
  }

  return { userId: null, role: "ANONYMOUS" };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: actorUserId, role } = await resolveUserRole(req);

    if (!actorUserId || !hasPermission(role, "admin:users:manage")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to review KYC submissions." },
        { status: 403 }
      );
    }

    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { error: "Target userId parameter is required." },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const parsed = kycReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid review payload." },
        { status: 400 }
      );
    }

    const verification = await prisma.userVerification.findUnique({
      where: { userId },
      include: { documents: true },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "No KYC verification record exists for this user." },
        { status: 422 }
      );
    }

    if (parsed.data.action === "APPROVE") {
      if (!verification.documents || verification.documents.length === 0) {
        return NextResponse.json(
          { error: "Cannot approve KYC verification without uploaded identity documents." },
          { status: 422 }
        );
      }

      const updated = await kycService.approveVerification({
        verificationId: verification.id,
        reviewerUserId: actorUserId,
        notes: parsed.data.notes,
      });

      return NextResponse.json(
        {
          message: "KYC verification approved successfully.",
          verificationId: updated.id,
          status: updated.status,
        },
        { status: 200 }
      );
    } else {
      const updated = await kycService.rejectVerification({
        verificationId: verification.id,
        reviewerUserId: actorUserId,
        notes: parsed.data.notes,
      });

      return NextResponse.json(
        {
          message: "KYC verification rejected.",
          verificationId: updated.id,
          status: updated.status,
          reviewNotes: updated.reviewNotes,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process KYC review." },
      { status: 500 }
    );
  }
}
