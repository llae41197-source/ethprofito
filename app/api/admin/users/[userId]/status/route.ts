import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { restricted?: boolean; kycStatus?: string }
    | null;

  if (typeof body?.restricted !== "boolean" || !body?.kycStatus?.trim()) {
    return NextResponse.json(
      { error: "Restricted flag and KYC status are required." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isRestricted: body.restricted,
      kycStatus: body.kycStatus.trim().toUpperCase()
    }
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      userId: user.id,
      action: "USER_STATUS_UPDATED",
      targetType: "USER",
      targetId: user.id,
      meta: JSON.stringify({
        restricted: user.isRestricted,
        kycStatus: user.kycStatus
      })
    }
  });

  return NextResponse.json({ ok: true });
}
