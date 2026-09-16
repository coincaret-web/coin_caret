import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/checkPermission";
import { getAllConfigs, setCcUsdRate } from "@/modules/admin/service/platform-config.service";

async function resolveUserRole(req: NextRequest): Promise<{ userId: string | null; role: string }> {
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

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await resolveUserRole(req);
    if (!userId || !hasPermission(role, "admin:config:read")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to read configuration." },
        { status: 403 }
      );
    }

    const configs = await getAllConfigs();
    return NextResponse.json({ configs }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve configs" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role } = await resolveUserRole(req);
    if (!userId || !hasPermission(role, "admin:config:write")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to update platform configuration." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Config key and value are required." },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (key === "CC_USD_RATE") {
      const updated = await setCcUsdRate(value, userId, clientIp);
      return NextResponse.json({ success: true, config: updated }, { status: 200 });
    }

    return NextResponse.json(
      { error: `Unknown configuration key: ${key}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update platform configuration." },
      { status: 400 }
    );
  }
}
