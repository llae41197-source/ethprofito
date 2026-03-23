import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";
import { binaryDurations } from "@/lib/data";
import { getBinaryRule } from "@/lib/binary-options";
import { getUsdQuote } from "@/lib/market-quotes";

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
        stakeAmount?: number;
      }
    | null;

  const assetSymbol = body?.assetSymbol?.trim().toUpperCase();
  const direction = body?.direction?.trim().toUpperCase();
  const durationSeconds = Number(body?.durationSeconds);
  const stakeAmount = Number(body?.stakeAmount);

  if (!assetSymbol || !["CALL", "PUT"].includes(direction ?? "")) {
    return NextResponse.json({ error: "Asset and direction are required." }, { status: 400 });
  }

  if (!binaryDurations.includes(durationSeconds as (typeof binaryDurations)[number])) {
    return NextResponse.json({ error: "Unsupported binary option duration." }, { status: 400 });
  }

  if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
    return NextResponse.json({ error: "Stake amount must be positive." }, { status: 400 });
  }

  const rule = getBinaryRule(durationSeconds);

  if (!rule) {
    return NextResponse.json({ error: "Unsupported binary option duration." }, { status: 400 });
  }

  if (stakeAmount < rule.minimumStake) {
    return NextResponse.json(
      {
        error: `Minimum stake for ${durationSeconds}s is ${rule.minimumStake} USDT.`
      },
      { status: 400 }
    );
  }

  const [asset, usdtAsset, usdtBalance, openingQuote] = await Promise.all([
    prisma.asset.findUnique({
      where: { symbol: assetSymbol }
    }),
    prisma.asset.findUnique({
      where: { symbol: "USDT" }
    }),
    prisma.balance.findFirst({
      where: {
        userId: session.id,
        asset: {
          symbol: "USDT"
        }
      },
      include: {
        asset: true
      }
    }),
    getUsdQuote(assetSymbol)
  ]);

  if (!asset || asset.assetClass !== "CRYPTO") {
    return NextResponse.json({ error: "Binary options are enabled only for supported cryptos." }, { status: 400 });
  }

  if (!usdtAsset) {
    return NextResponse.json({ error: "USDT wallet asset is not configured." }, { status: 500 });
  }

  if (!usdtBalance || Number(usdtBalance.amount) < stakeAmount) {
    return NextResponse.json({ error: "Insufficient USDT available balance." }, { status: 400 });
  }

  const openingPrice = openingQuote?.price ?? 0;

  if (!openingPrice) {
    return NextResponse.json({ error: "No opening quote available for this asset." }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.balance.update({
      where: { id: usdtBalance.id },
      data: {
        amount: Number(usdtBalance.amount) - stakeAmount,
        lockedAmount: Number(usdtBalance.lockedAmount) + stakeAmount
      }
    });

    await tx.binaryOptionTrade.create({
      data: {
        userId: session.id,
        assetId: asset.id,
        marketSymbol: `${assetSymbol}USD`,
        direction: direction as "CALL" | "PUT",
        durationSeconds,
        payoutPercent: rule.payoutPercent,
        stakeAmount,
        openingPrice,
        expiresAt,
        status: "OPEN"
      }
    });

    await tx.ledgerEntry.create({
      data: {
        userId: session.id,
        assetId: usdtAsset.id,
        type: "HOLD",
        amount: -stakeAmount,
        reference: `binary-option-${Date.now()}`,
        notes: `Binary option ${direction} ${durationSeconds}s at ${rule.payoutPercent}% payout using USDT stake`
      }
    });
  });

  return NextResponse.json({
    ok: true,
    message: `Binary option ticket created. ${stakeAmount.toFixed(2)} USDT is now locked until the ${durationSeconds}s timer expires.`
  });
}
