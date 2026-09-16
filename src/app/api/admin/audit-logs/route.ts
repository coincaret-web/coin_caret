import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/modules/admin/service/audit-log.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const limit = Number(searchParams.get("limit") || "50");
    const offset = Number(searchParams.get("offset") || "0");

    const result = await getAuditLogs({ action, entityType, limit, offset });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query audit logs" }, { status: 500 });
  }
}
