import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    optionId: string;
  }>;
};

export async function POST(_request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { optionId } = await context.params;

  const option = await prisma.binaryOptionTrade.findUnique({
    where: { id: optionId }
  });

  if (!option) {
    return NextResponse.json({ error: "Binary option record not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (option.status === "OPEN") {
      const usdtAsset = await tx.asset.findUnique({
        where: { symbol: "USDT" }
      });

      if (!usdtAsset) {
        throw new Error("USDT asset is not configured.");
      }

      const balance = await tx.balance.findUnique({
        where: {
          userId_assetId: {
            userId: option.userId,
            assetId: usdtAsset.id
          }
        }
      });

      if (balance) {
        await tx.balance.update({
          where: { id: balance.id },
          data: {
            amount: Number(balance.amount) + Number(option.stakeAmount),
            lockedAmount: Math.max(0, Number(balance.lockedAmount) - Number(option.stakeAmount))
          }
        });
      }

      await tx.ledgerEntry.create({
        data: {
          userId: option.userId,
          assetId: usdtAsset.id,
          type: "RELEASE",
          amount: option.stakeAmount,
          reference: option.id,
          notes: "Open binary option deleted by admin and capital released"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: option.userId,
        action: "BINARY_OPTION_RECORD_DELETED",
        targetType: "BINARY_OPTION",
        targetId: option.id,
        meta: JSON.stringify({
          stakeAmount: Number(option.stakeAmount),
          status: option.status
        })
      }
    });

    await tx.binaryOptionTrade.delete({
      where: { id: option.id }
    });
  });

  return NextResponse.json({ ok: true });
}
