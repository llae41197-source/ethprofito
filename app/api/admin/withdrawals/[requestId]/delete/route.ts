import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(_request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { requestId } = await context.params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId }
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal record not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (withdrawal.status === "PENDING") {
      const balance = await tx.balance.findUnique({
        where: {
          userId_assetId: {
            userId: withdrawal.userId,
            assetId: withdrawal.assetId
          }
        }
      });

      if (balance) {
        await tx.balance.update({
          where: { id: balance.id },
          data: {
            amount: Number(balance.amount) + Number(withdrawal.amount),
            lockedAmount: Math.max(0, Number(balance.lockedAmount) - Number(withdrawal.amount))
          }
        });
      }

      await tx.ledgerEntry.create({
        data: {
          userId: withdrawal.userId,
          assetId: withdrawal.assetId,
          type: "RELEASE",
          amount: withdrawal.amount,
          reference: withdrawal.id,
          notes: "Pending withdrawal deleted by admin and funds released"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: withdrawal.userId,
        action: "WITHDRAWAL_RECORD_DELETED",
        targetType: "WITHDRAWAL_REQUEST",
        targetId: withdrawal.id,
        meta: JSON.stringify({
          amount: Number(withdrawal.amount),
          status: withdrawal.status
        })
      }
    });

    await tx.withdrawalRequest.delete({
      where: { id: withdrawal.id }
    });
  });

  return NextResponse.json({ ok: true });
}
