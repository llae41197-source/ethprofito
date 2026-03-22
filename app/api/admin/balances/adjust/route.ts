import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

export async function POST(request: Request) {
  const admin = await requireApiAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        userId?: string;
        assetSymbol?: string;
        amount?: number;
        note?: string;
      }
    | null;

  const userId = body?.userId?.trim();
  const assetSymbol = body?.assetSymbol?.trim().toUpperCase();
  const amount = Number(body?.amount);
  const note = body?.note?.trim();

  if (!userId || !assetSymbol || !Number.isFinite(amount) || !note) {
    return NextResponse.json(
      { error: "User, asset, amount, and a clear note are required." },
      { status: 400 }
    );
  }

  if (Math.abs(amount) > 1_000_000) {
    return NextResponse.json(
      { error: "Adjustment exceeds the allowed safety threshold." },
      { status: 400 }
    );
  }

  const asset = await prisma.asset.findUnique({
    where: { symbol: assetSymbol }
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const currentBalance = await tx.balance.findUnique({
        where: {
          userId_assetId: {
            userId,
            assetId: asset.id
          }
        }
      });

      const nextAmount = Number(currentBalance?.amount ?? 0) + amount;

      if (nextAmount < 0) {
        throw new Error("Balance cannot be reduced below zero.");
      }

      await tx.balance.upsert({
        where: {
          userId_assetId: {
            userId,
            assetId: asset.id
          }
        },
        update: {
          amount: nextAmount
        },
        create: {
          userId,
          assetId: asset.id,
          amount: nextAmount,
          lockedAmount: 0
        }
      });

      await tx.ledgerEntry.create({
        data: {
          userId,
          assetId: asset.id,
          type: "ADJUSTMENT",
          amount,
          notes: note,
          reference: `admin-adjustment-${Date.now()}`
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          userId,
          action: "BALANCE_ADJUSTMENT",
          targetType: "BALANCE",
          meta: JSON.stringify({
            asset: asset.symbol,
            amount,
            note
          })
        }
      });
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to adjust balance." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
