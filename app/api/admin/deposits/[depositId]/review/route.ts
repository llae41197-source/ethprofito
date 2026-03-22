import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    depositId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { depositId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { status?: string; adminNote?: string }
    | null;

  const status = body?.status?.trim().toUpperCase();
  const adminNote = body?.adminNote?.trim() ?? "";

  if (!["APPROVED", "REJECTED"].includes(status ?? "")) {
    return NextResponse.json({ error: "Invalid deposit review status." }, { status: 400 });
  }

  const deposit = await prisma.depositSubmission.findUnique({
    where: { id: depositId },
    include: { asset: true }
  });

  if (!deposit) {
    return NextResponse.json({ error: "Deposit submission not found." }, { status: 404 });
  }

  if (deposit.status !== "PENDING") {
    return NextResponse.json({ error: "This deposit has already been reviewed." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.depositSubmission.update({
      where: { id: deposit.id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        adminNote: adminNote || null,
        reviewedAt: new Date()
      }
    });

    if (status === "APPROVED") {
      const balance = await tx.balance.findUnique({
        where: {
          userId_assetId: {
            userId: deposit.userId,
            assetId: deposit.assetId
          }
        }
      });

      await tx.balance.upsert({
        where: {
          userId_assetId: {
            userId: deposit.userId,
            assetId: deposit.assetId
          }
        },
        update: {
          amount: Number(balance?.amount ?? 0) + Number(deposit.amount)
        },
        create: {
          userId: deposit.userId,
          assetId: deposit.assetId,
          amount: Number(deposit.amount),
          lockedAmount: 0
        }
      });

      await tx.ledgerEntry.create({
        data: {
          userId: deposit.userId,
          assetId: deposit.assetId,
          type: "DEPOSIT",
          amount: deposit.amount,
          reference: deposit.txHash ?? deposit.id,
          notes: adminNote || "Approved after manual screenshot review"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: deposit.userId,
        action: `DEPOSIT_${status}`,
        targetType: "DEPOSIT_SUBMISSION",
        targetId: deposit.id,
        meta: JSON.stringify({
          asset: deposit.asset.symbol,
          amount: Number(deposit.amount),
          adminNote
        })
      }
    });
  });

  return NextResponse.json({ ok: true });
}
