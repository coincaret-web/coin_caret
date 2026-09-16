import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/checkPermission";
import { getNetworkConfig, updateNetworkConfig } from "@/modules/admin/service/network-config.service";

async function resolveUserRole(req: NextRequest): Promise<{ userId: string | null; role: string }> {
  // 1. Check x-user-id header first (for automated testing / service calls)
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

  // 2. Check NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const user = session.user as any;
      return { userId: user.id, role: user.role || "USER" };
    }
  } catch {
    // Session resolution not available in direct test execution
  }

  return { userId: null, role: "ANONYMOUS" };
}

export async function GET(req: NextRequest) {
  try {
    const settings = await getNetworkConfig();
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve network config." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role } = await resolveUserRole(req);

    if (!userId || !hasPermission(role, "admin:network:config")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions for network configuration." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const updated = await updateNetworkConfig(body, userId, clientIp);
    return NextResponse.json({ success: true, settings: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Invalid network configuration payload." },
      { status: 400 }
    );
  }
}
