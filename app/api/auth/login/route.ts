import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; next?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;
  const next = body?.next?.startsWith("/") ? body.next : null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.isRestricted) {
    return NextResponse.json(
      { error: "This account is restricted. Contact support or an administrator." },
      { status: 403 }
    );
  }

  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  await setSessionCookie(token);

  const safeRedirect =
    next && (!next.startsWith("/admin") || user.role === "ADMIN" || user.role === "SUPPORT")
      ? next
      : null;

  return NextResponse.json({
    ok: true,
    redirectTo: safeRedirect ?? (user.role === "ADMIN" ? "/admin" : "/wallet")
  });
}
