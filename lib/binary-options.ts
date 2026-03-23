import "server-only";
import { prisma } from "@/lib/prisma";
import { getUsdQuote } from "@/lib/market-quotes";
import { binaryOptionRules } from "@/lib/data";

export function getBinaryRule(durationSeconds: number) {
  return binaryOptionRules.find((rule) => rule.durationSeconds === durationSeconds) ?? null;
}

export async function settleExpiredBinaryOptionsForUser(userId: string) {
  const expiredOptions = await prisma.binaryOptionTrade.findMany({
    where: {
      userId,
      status: "OPEN",
      expiresAt: {
        lte: new Date()
      }
    },
    include: {
      asset: true,
      user: true
    },
    orderBy: { expiresAt: "asc" }
  });

  if (expiredOptions.length === 0) {
    return;
  }

  const usdtAsset = await prisma.asset.findUnique({
    where: { symbol: "USDT" }
  });

  if (!usdtAsset) {
    return;
  }

  for (const option of expiredOptions) {
    const quote = await getUsdQuote(option.asset.symbol);
    const closingPrice = quote?.price ?? Number(option.openingPrice);
    const openingPrice = Number(option.openingPrice);
    const stakeAmount = Number(option.stakeAmount);
    const profit = stakeAmount * (option.payoutPercent / 100);
    const status: "WON" = "WON";
    const payoutAmount = stakeAmount + profit;

    await prisma.$transaction(async (tx) => {
      const usdtBalance = await tx.balance.findUnique({
        where: {
          userId_assetId: {
            userId: option.userId,
            assetId: usdtAsset.id
          }
        }
      });

      if (!usdtBalance) {
        return;
      }

      await tx.balance.update({
        where: { id: usdtBalance.id },
        data: {
          amount: Number(usdtBalance.amount) + payoutAmount,
          lockedAmount: Math.max(0, Number(usdtBalance.lockedAmount) - stakeAmount)
        }
      });

      await tx.binaryOptionTrade.update({
        where: { id: option.id },
        data: {
          status,
          closingPrice,
          payoutAmount,
          settledAt: new Date()
        }
      });

      if (status === "WON") {
        await tx.ledgerEntry.createMany({
          data: [
            {
              userId: option.userId,
              assetId: usdtAsset.id,
              type: "RELEASE",
              amount: stakeAmount,
              reference: option.id,
              notes: "Practice trade capital released after simulated winning outcome."
            },
            {
              userId: option.userId,
              assetId: usdtAsset.id,
              type: "TRADE",
              amount: profit,
              reference: option.id,
              notes: "Practice trade profit credited automatically."
            }
          ]
        });
      }
    });
  }
}
