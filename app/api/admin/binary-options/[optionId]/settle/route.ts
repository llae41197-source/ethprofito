import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

type Context = {
  params: Promise<{
    optionId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { optionId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { outcome?: string; closingPrice?: number; adminNote?: string }
    | null;

  const outcome = body?.outcome?.trim().toUpperCase();
  const closingPrice = Number(body?.closingPrice);
  const adminNote = body?.adminNote?.trim() ?? "";

  if (!["WON", "LOST", "CANCELLED"].includes(outcome ?? "")) {
    return NextResponse.json({ error: "Invalid settlement outcome." }, { status: 400 });
  }

  if (!Number.isFinite(closingPrice) || closingPrice <= 0) {
    return NextResponse.json({ error: "A valid closing price is required." }, { status: 400 });
  }

  const option = await prisma.binaryOptionTrade.findUnique({
    where: { id: optionId }
  });

  if (!option) {
    return NextResponse.json({ error: "Binary option ticket not found." }, { status: 404 });
  }

  if (option.status !== "OPEN") {
    return NextResponse.json({ error: "This binary option is already settled." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const balance = await tx.balance.findUnique({
      where: {
        userId_assetId: {
          userId: option.userId,
          assetId: option.assetId
        }
      }
    });

    const releaseAmount =
      outcome === "WON"
        ? Number(option.stakeAmount) * (1 + option.payoutPercent / 100)
        : outcome === "CANCELLED"
          ? Number(option.stakeAmount)
          : 0;

    if (balance) {
      await tx.balance.update({
        where: { id: balance.id },
        data: {
          amount: Number(balance.amount) + releaseAmount,
          lockedAmount: Math.max(0, Number(balance.lockedAmount) - Number(option.stakeAmount))
        }
      });
    }

    await tx.binaryOptionTrade.update({
      where: { id: option.id },
      data: {
        status: outcome as "WON" | "LOST" | "CANCELLED",
        closingPrice,
        settledAt: new Date(),
        payoutAmount: releaseAmount
      }
    });

    await tx.ledgerEntry.create({
      data: {
        userId: option.userId,
        assetId: option.assetId,
        type: outcome === "WON" ? "TRADE" : outcome === "CANCELLED" ? "RELEASE" : "FEE",
        amount: releaseAmount,
        reference: option.id,
        notes: adminNote || `Binary option settled as ${outcome}`
      }
    });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        userId: option.userId,
        action: `BINARY_OPTION_${outcome}`,
        targetType: "BINARY_OPTION",
        targetId: option.id,
        meta: JSON.stringify({
          closingPrice,
          payoutAmount: releaseAmount,
          adminNote
        })
      }
    });
  });

  return NextResponse.json({ ok: true });
}
