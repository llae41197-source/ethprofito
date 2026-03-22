import { NextResponse } from "next/server";
import { getDashboardSnapshot } from "@/lib/queries";

export async function GET() {
  const data = await getDashboardSnapshot();

  return NextResponse.json({
    users: data.users,
    balanceTotal: data.balances._sum.amount ?? 0,
    lockedTotal: data.balances._sum.lockedAmount ?? 0,
    openTrades: data.trades.length,
    depositAddresses: data.deposits
  });
}
