import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie } from "@/lib/session";
import { WALLET_CHALLENGE_COOKIE_NAME } from "@/lib/constants";

export async function POST(request: Request) {
  await clearSessionCookie();
  const store = await cookies();
  store.set(WALLET_CHALLENGE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return NextResponse.redirect(new URL("/", request.url));
}
