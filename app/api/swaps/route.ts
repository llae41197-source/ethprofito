import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";

const fallbackRatesToUsd: Record<string, number> = {
  BTC: 84320,
  ETH: 4180,
  SOL: 162.12,
  USDT: 1,
  XAU: 2488
};

const coingeckoIds: Partial<Record<string, string>> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  USDT: "tether"
};

async function getUsdRate(symbol: string) {
  if (symbol === "USDT") {
    return { price: 1, source: "Fixed USD peg" };
  }

  const coingeckoId = coingeckoIds[symbol];

  if (coingeckoId) {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
        {
          cache: "no-store"
        }
      );

      if (response.ok) {
        const data = (await response.json()) as Record<string, { usd?: number }>;
        const price = Number(data[coingeckoId]?.usd ?? 0);

        if (price > 0) {
          return { price, source: "CoinGecko" };
        }
      }
    } catch {
      // Fall back to configured backup values below.
    }
  }

  if (symbol === "XAU" && process.env.ALPHA_VANTAGE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        {
          cache: "no-store"
        }
      );

      if (response.ok) {
        const data = (await response.json()) as {
          "Realtime Currency Exchange Rate"?: Record<string, string>;
        };
        const price = Number(
          data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"] ?? 0
        );

        if (price > 0) {
          return { price, source: "Alpha Vantage" };
        }
      }
    } catch {
      // Fall back to configured backup values below.
    }
  }

  const fallback = fallbackRatesToUsd[symbol];
  return fallback ? { price: fallback, source: "Fallback" } : null;
}

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
    getUsdRate(fromAssetSymbol),
    getUsdRate(toAssetSymbol)
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
