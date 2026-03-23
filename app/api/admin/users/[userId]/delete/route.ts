import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(_request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { userId } = await context.params;

  if (admin.id === userId) {
    return NextResponse.json({ error: "You cannot delete the current admin account." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: user.id,
        action: "USER_DELETED",
        targetType: "USER",
        targetId: user.id,
        meta: JSON.stringify({
          email: user.email
        })
      }
    });

    await tx.user.delete({
      where: { id: user.id }
    });
  });

  return NextResponse.json({ ok: true });
}
