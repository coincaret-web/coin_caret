import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/checkPermission";
import { getAllExchangeRates, setPairRate } from "@/modules/market/service/exchange-rate.service";

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
    // fallback
  }

  return { userId: null, role: "ANONYMOUS" };
}

export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await resolveUserRole(req);
    if (!userId || !hasPermission(role, "admin:config:read")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to read exchange rates." },
        { status: 403 }
      );
    }

    const rates = await getAllExchangeRates();
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve exchange rates." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, role } = await resolveUserRole(req);
    if (!userId || !hasPermission(role, "admin:config:write")) {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions to update exchange rates." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fromSymbol, toSymbol, rate } = body;

    if (!fromSymbol || !toSymbol || rate === undefined) {
      return NextResponse.json(
        { error: "fromSymbol, toSymbol, and rate are required." },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const updated = await setPairRate({
      fromSymbol,
      toSymbol,
      rate,
      actorUserId: userId,
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, rate: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update exchange rate." },
      { status: 400 }
    );
  }
}
