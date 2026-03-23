import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { WALLET_CHALLENGE_COOKIE_NAME } from "@/lib/constants";
import {
  createWalletDisplayName,
  createWalletEmail,
  createWalletMessage,
  isExpiredChallenge,
  normalizeWalletAddress,
  type WalletChallengePayload
} from "@/lib/wallet-auth";
import { isAddress, verifyMessage } from "viem";

function clearWalletChallenge(store: Awaited<ReturnType<typeof cookies>>) {
  store.set(WALLET_CHALLENGE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { address?: string; signature?: string; next?: string }
    | null;

  const rawAddress = body?.address?.trim();
  const signature = body?.signature?.trim();
  const next = body?.next?.startsWith("/") ? body.next : null;

  if (!rawAddress || !signature || !isAddress(rawAddress)) {
    return NextResponse.json({ error: "Wallet address and signature are required." }, { status: 400 });
  }

  const address = normalizeWalletAddress(rawAddress);
  const store = await cookies();
  const challengeCookie = store.get(WALLET_CHALLENGE_COOKIE_NAME)?.value;

  if (!challengeCookie) {
    return NextResponse.json({ error: "Wallet challenge expired. Try connecting again." }, { status: 400 });
  }

  let challenge: WalletChallengePayload | null = null;

  try {
    challenge = JSON.parse(Buffer.from(challengeCookie, "base64url").toString("utf8")) as WalletChallengePayload;
  } catch {
    clearWalletChallenge(store);
    return NextResponse.json({ error: "Wallet challenge was invalid. Try again." }, { status: 400 });
  }

  if (challenge.address !== address || isExpiredChallenge(challenge)) {
    clearWalletChallenge(store);
    return NextResponse.json({ error: "Wallet challenge expired. Try connecting again." }, { status: 400 });
  }

  const message = createWalletMessage(challenge);
  const verified = await verifyMessage({
    address,
    message,
    signature: signature as `0x${string}`
  }).catch(() => false);

  if (!verified) {
    clearWalletChallenge(store);
    return NextResponse.json({ error: "Wallet signature could not be verified." }, { status: 401 });
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ walletAddress: address }, { email: createWalletEmail(address) }]
    }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: createWalletEmail(address),
        walletAddress: address,
        name: createWalletDisplayName(address),
        kycStatus: "PENDING"
      }
    });
  } else if (!user.walletAddress) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        walletAddress: address
      }
    });
  }

  if (user.isRestricted) {
    clearWalletChallenge(store);
    return NextResponse.json(
      { error: "This wallet account is restricted. Contact support or an administrator." },
      { status: 403 }
    );
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  await setSessionCookie(token);
  clearWalletChallenge(store);

  const safeRedirect =
    next && (!next.startsWith("/admin") || user.role === "ADMIN" || user.role === "SUPPORT")
      ? next
      : null;

  return NextResponse.json({
    ok: true,
    redirectTo: safeRedirect ?? (user.role === "ADMIN" ? "/admin" : "/dashboard")
  });
}
