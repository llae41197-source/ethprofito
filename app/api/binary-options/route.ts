import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";
import { binaryDurations, binaryPayoutPercents } from "@/lib/data";

const simulatedQuotes: Record<string, number> = {
  BTC: 84320,
  ETH: 4180,
  SOL: 162.12
};

export async function POST(request: Request) {
  const session = await requireApiUserSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (session.isRestricted) {
    return NextResponse.json({ error: "Your account is restricted." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        assetSymbol?: string;
        direction?: string;
        durationSeconds?: number;
        payoutPercent?: number;
        stakeAmount?: number;
      }
    | null;

  const assetSymbol = body?.assetSymbol?.trim().toUpperCase();
  const direction = body?.direction?.trim().toUpperCase();
  const durationSeconds = Number(body?.durationSeconds);
  const payoutPercent = Number(body?.payoutPercent);
  const stakeAmount = Number(body?.stakeAmount);

  if (!assetSymbol || !["CALL", "PUT"].includes(direction ?? "")) {
    return NextResponse.json({ error: "Asset and direction are required." }, { status: 400 });
  }

  if (!binaryDurations.includes(durationSeconds as (typeof binaryDurations)[number])) {
    return NextResponse.json({ error: "Unsupported binary option duration." }, { status: 400 });
  }

  if (!binaryPayoutPercents.includes(payoutPercent as (typeof binaryPayoutPercents)[number])) {
    return NextResponse.json({ error: "Unsupported payout percentage." }, { status: 400 });
  }

  if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
    return NextResponse.json({ error: "Stake amount must be positive." }, { status: 400 });
  }

  const [asset, balance] = await Promise.all([
    prisma.asset.findUnique({
      where: { symbol: assetSymbol }
    }),
    prisma.balance.findFirst({
      where: {
        userId: session.id,
        asset: {
          symbol: assetSymbol
        }
      },
      include: {
        asset: true
      }
    })
  ]);

  if (!asset || asset.assetClass !== "CRYPTO") {
    return NextResponse.json({ error: "Binary options are enabled only for supported cryptos." }, { status: 400 });
  }

  if (!balance || Number(balance.amount) < stakeAmount) {
    return NextResponse.json({ error: "Insufficient available balance." }, { status: 400 });
  }

  const openingPrice = simulatedQuotes[assetSymbol] ?? 0;

  if (!openingPrice) {
    return NextResponse.json({ error: "No opening quote available for this asset." }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.balance.update({
      where: { id: balance.id },
      data: {
        amount: Number(balance.amount) - stakeAmount,
        lockedAmount: Number(balance.lockedAmount) + stakeAmount
      }
    });

    await tx.binaryOptionTrade.create({
      data: {
        userId: session.id,
        assetId: asset.id,
        marketSymbol: `${assetSymbol}USD`,
        direction: direction as "CALL" | "PUT",
        durationSeconds,
        payoutPercent,
        stakeAmount,
        openingPrice,
        expiresAt,
        status: "OPEN"
      }
    });

    await tx.ledgerEntry.create({
      data: {
        userId: session.id,
        assetId: asset.id,
        type: "HOLD",
        amount: -stakeAmount,
        reference: `binary-option-${Date.now()}`,
        notes: `Binary option ${direction} ${durationSeconds}s at ${payoutPercent}% payout`
      }
    });
  });

  return NextResponse.json({
    ok: true,
    message: "Binary option ticket created and stake moved into locked balance."
  });
}
