import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    depositId: string;
  }>;
};

export async function POST(_request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { depositId } = await context.params;

  const deposit = await prisma.depositSubmission.findUnique({
    where: { id: depositId },
    include: { asset: true }
  });

  if (!deposit) {
    return NextResponse.json({ error: "Deposit record not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: deposit.userId,
        action: "DEPOSIT_RECORD_DELETED",
        targetType: "DEPOSIT_SUBMISSION",
        targetId: deposit.id,
        meta: JSON.stringify({
          asset: deposit.asset.symbol,
          amount: Number(deposit.amount),
          status: deposit.status
        })
      }
    });

    await tx.depositSubmission.delete({
      where: { id: deposit.id }
    });
  });

  return NextResponse.json({ ok: true });
}
