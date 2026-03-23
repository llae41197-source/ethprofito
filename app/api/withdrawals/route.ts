import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireApiUserSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        assetSymbol?: string;
        amount?: number;
        network?: string;
        destination?: string;
        note?: string;
      }
    | null;

  const assetSymbol = body?.assetSymbol?.trim().toUpperCase();
  const amount = Number(body?.amount);
  const network = body?.network?.trim();
  const destination = body?.destination?.trim();
  const note = body?.note?.trim();

  if (!assetSymbol || !Number.isFinite(amount) || amount <= 0 || !network || !destination) {
    return NextResponse.json({ error: "Asset, amount, network, and destination are required." }, { status: 400 });
  }

  const balance = await prisma.balance.findFirst({
    where: {
      userId: session.id,
      asset: { symbol: assetSymbol }
    },
    include: { asset: true }
  });

  if (!balance || Number(balance.amount) < amount) {
    return NextResponse.json({ error: "Insufficient available balance." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.balance.update({
      where: { id: balance.id },
      data: {
        amount: Number(balance.amount) - amount,
        lockedAmount: Number(balance.lockedAmount) + amount
      }
    });

    await tx.withdrawalRequest.create({
      data: {
        userId: session.id,
        assetId: balance.assetId,
        amount,
        network,
        destination,
        note: note || null
      }
    });

    await tx.ledgerEntry.create({
      data: {
        userId: session.id,
        assetId: balance.assetId,
        type: "HOLD",
        amount: -amount,
        notes: "Withdrawal request submitted and amount moved to locked balance."
      }
    });
  });

  return NextResponse.json({ ok: true, message: "Withdrawal request submitted for admin review." });
}
