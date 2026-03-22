import { NextResponse } from "next/server";
import { getMarketCards } from "@/lib/queries";

export async function GET() {
  const markets = await getMarketCards();

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    markets
  });
}
