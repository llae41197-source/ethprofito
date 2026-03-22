import { NextResponse } from "next/server";
import { featuredMarkets } from "@/lib/data";

export async function GET() {
  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    markets: featuredMarkets
  });
}
