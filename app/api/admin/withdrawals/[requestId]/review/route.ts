import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const admin = await requireApiAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { requestId } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: string; adminNote?: string } | null;
  const status = body?.status?.trim().toUpperCase();
  const adminNote = body?.adminNote?.trim() ?? "";

  if (!["APPROVED", "REJECTED"].includes(status ?? "")) {
    return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId }
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Withdrawal request not found." }, { status: 404 });
  }

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Withdrawal request already reviewed." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const balance = await tx.balance.findUnique({
      where: {
        userId_assetId: {
          userId: withdrawal.userId,
          assetId: withdrawal.assetId
        }
      }
    });

    await tx.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        adminNote: adminNote || null,
        reviewedAt: new Date()
      }
    });

    if (balance) {
      await tx.balance.update({
        where: { id: balance.id },
        data: {
          amount: status === "REJECTED" ? Number(balance.amount) + Number(withdrawal.amount) : Number(balance.amount),
          lockedAmount: Math.max(
            0,
            Number(balance.lockedAmount) - Number(withdrawal.amount)
          )
        }
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: withdrawal.userId,
        action: `WITHDRAWAL_${status}`,
        targetType: "WITHDRAWAL_REQUEST",
        targetId: withdrawal.id,
        meta: JSON.stringify({
          amount: Number(withdrawal.amount),
          adminNote
        })
      }
    });
  });

  return NextResponse.json({ ok: true });
}
