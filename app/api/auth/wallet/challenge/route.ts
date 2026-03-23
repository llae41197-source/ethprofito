import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAddress } from "viem";
import { WALLET_CHALLENGE_COOKIE_NAME } from "@/lib/constants";
import { createWalletChallenge, createWalletMessage, normalizeWalletAddress } from "@/lib/wallet-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { address?: string; chainId?: number } | null;
  const rawAddress = body?.address?.trim();
  const chainId = Number(body?.chainId);

  if (!rawAddress || !isAddress(rawAddress)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const payload = createWalletChallenge(
    normalizeWalletAddress(rawAddress),
    Number.isFinite(chainId) && chainId > 0 ? chainId : undefined
  );
  const store = await cookies();

  store.set(
    WALLET_CHALLENGE_COOKIE_NAME,
    Buffer.from(JSON.stringify(payload)).toString("base64url"),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10
    }
  );

  return NextResponse.json({
    ok: true,
    message: createWalletMessage(payload),
    address: payload.address
  });
}
