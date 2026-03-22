import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

type SessionPayload = {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }

  return secret;
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">, maxAgeSeconds = 60 * 60 * 12) {
  const completePayload: SessionPayload = {
    ...payload,
    exp: Date.now() + maxAgeSeconds * 1000
  };
  const encodedPayload = encodePayload(completePayload);
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (
    Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature) ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (payload.exp <= Date.now()) {
    return null;
  }

  return payload;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getOptionalSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isRestricted: true,
      kycStatus: true
    }
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function requireUserSession() {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await requireUserSession();

  if (session.role !== "ADMIN" && session.role !== "SUPPORT") {
    redirect("/dashboard");
  }

  return session;
}

export async function requireApiUserSession() {
  return getOptionalSession();
}

export async function requireApiAdminSession() {
  const session = await getOptionalSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPPORT")) {
    return null;
  }

  return session;
}
