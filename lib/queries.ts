import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { depositAddresses, featuredMarkets, sampleAccounts } from "@/lib/data";

async function isDatabaseReady() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.startsWith("file:")) {
    return true;
  }

  const filePath = databaseUrl.replace("file:", "");
  const resolvedPath = path.resolve(process.cwd(), filePath);

  try {
    const info = await stat(resolvedPath);
    return info.size > 0;
  } catch {
    return false;
  }
}

export async function getDashboardSnapshot() {
  if (!(await isDatabaseReady())) {
    return {
      users: sampleAccounts.length,
      balances: { _sum: { amount: 783554.22, lockedAmount: 42000.0 } },
      trades: [],
      deposits: depositAddresses.map((item) => ({
        assetCode: item.symbol,
        network: item.chain,
        address: item.address,
        active: true
      })),
      auditLogs: []
    };
  }

  try {
    const [users, balances, trades, deposits, auditLogs] = await Promise.all([
      prisma.user.count(),
      prisma.balance.aggregate({ _sum: { amount: true, lockedAmount: true } }),
      prisma.trade.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: true }
      }),
      prisma.depositAddress.findMany({ orderBy: { assetCode: "asc" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { admin: true, user: true }
      })
    ]);

    return {
      users,
      balances,
      trades,
      deposits,
      auditLogs
    };
  } catch {
    return {
      users: sampleAccounts.length,
      balances: { _sum: { amount: 783554.22, lockedAmount: 42000.0 } },
      trades: [],
      deposits: depositAddresses.map((item) => ({
        assetCode: item.symbol,
        network: item.chain,
        address: item.address,
        active: true
      })),
      auditLogs: []
    };
  }
}

export async function getMarketCards() {
  return featuredMarkets;
}
