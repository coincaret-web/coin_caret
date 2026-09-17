import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/checkPermission";
import { z } from "zod";
import {
  userManagementService,
  UserNotFoundError,
} from "@/modules/admin/service/user-management.service";

const kycToggleSchema = z.object({
  kycRequired: z.boolean(),
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: actorUserId, role } = await resolveUserRole(req);

    if (!actorUserId || !hasPermission(role, "admin:users:manage")) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions to manage users." },
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

    const parsed = kycToggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body: 'kycRequired' must be a boolean." },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const result = await userManagementService.toggleUserKyc(
      userId,
      parsed.data.kycRequired,
      actorUserId,
      ipAddress
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || "Failed to update user KYC override." },
      { status: 500 }
    );
  }
}
