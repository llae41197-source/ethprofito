import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";
import { getUsdQuote } from "@/lib/market-quotes";

export async function POST(request: Request) {
  const session = await requireApiUserSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { fromAssetSymbol?: string; toAssetSymbol?: string; fromAmount?: number }
    | null;

  const fromAssetSymbol = body?.fromAssetSymbol?.trim().toUpperCase();
  const toAssetSymbol = body?.toAssetSymbol?.trim().toUpperCase();
  const fromAmount = Number(body?.fromAmount);

  if (!fromAssetSymbol || !toAssetSymbol || fromAssetSymbol === toAssetSymbol) {
    return NextResponse.json({ error: "Choose two different assets." }, { status: 400 });
  }

  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return NextResponse.json({ error: "Enter a valid swap amount." }, { status: 400 });
  }

  const [fromAsset, toAsset, fromBalance] = await Promise.all([
    prisma.asset.findUnique({ where: { symbol: fromAssetSymbol } }),
    prisma.asset.findUnique({ where: { symbol: toAssetSymbol } }),
    prisma.balance.findFirst({
      where: {
        userId: session.id,
        asset: { symbol: fromAssetSymbol }
      }
    })
  ]);

  if (!fromAsset || !toAsset) {
    return NextResponse.json({ error: "One of the selected assets was not found." }, { status: 404 });
  }

  if (!fromBalance || Number(fromBalance.amount) < fromAmount) {
    return NextResponse.json({ error: "Insufficient balance for swap." }, { status: 400 });
  }

  const [fromQuote, toQuote] = await Promise.all([
    getUsdQuote(fromAssetSymbol),
    getUsdQuote(toAssetSymbol)
  ]);

  if (!fromQuote || !toQuote) {
    return NextResponse.json({ error: "Swap pair is not supported." }, { status: 400 });
  }

  const usdValue = fromAmount * fromQuote.price;
  const feeAdjustedUsd = usdValue * 0.99;
  const toAmount = feeAdjustedUsd / toQuote.price;
  const rate = toAmount / fromAmount;

  await prisma.$transaction(async (tx) => {
    await tx.balance.update({
      where: { id: fromBalance.id },
      data: {
        amount: Number(fromBalance.amount) - fromAmount
      }
    });

    const destinationBalance = await tx.balance.findUnique({
      where: {
        userId_assetId: {
          userId: session.id,
          assetId: toAsset.id
        }
      }
    });

    await tx.balance.upsert({
      where: {
        userId_assetId: {
          userId: session.id,
          assetId: toAsset.id
        }
      },
      update: {
        amount: Number(destinationBalance?.amount ?? 0) + toAmount
      },
      create: {
        userId: session.id,
        assetId: toAsset.id,
        amount: toAmount,
        lockedAmount: 0
      }
    });

    await tx.swapOrder.create({
      data: {
        userId: session.id,
        fromAssetId: fromAsset.id,
        toAssetId: toAsset.id,
        fromAmount,
        toAmount,
        rate,
        status: "COMPLETED",
        note: `Internal wallet swap with 1% spread using ${fromQuote.source}/${toQuote.source} USD quotes.`
      }
    });

    await tx.auditLog.create({
      data: {
        userId: session.id,
        action: "SWAP_COMPLETED",
        targetType: "SWAP_ORDER",
        meta: JSON.stringify({
          fromAsset: fromAssetSymbol,
          toAsset: toAssetSymbol,
          fromAmount,
          toAmount,
          rate,
          fromUsdPrice: fromQuote.price,
          toUsdPrice: toQuote.price,
          sources: {
            from: fromQuote.source,
            to: toQuote.source
          }
        })
      }
    });
  });

  return NextResponse.json({
    ok: true,
    message: `Swap completed: received ${toAmount.toFixed(4)} ${toAssetSymbol}.`
  });
}
