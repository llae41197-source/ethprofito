import { NextResponse } from "next/server";
import { getAdminSnapshot } from "@/lib/queries";
import { requireApiAdminSession } from "@/lib/session";

export async function GET() {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const data = await getAdminSnapshot();

  return NextResponse.json({
    users: data.totals.totalUsers,
    restrictedUsers: data.totals.restrictedUsers,
    auditLogs: data.auditLogs.length
  });
}
