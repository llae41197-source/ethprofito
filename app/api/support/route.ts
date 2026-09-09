import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireApiUserSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const conversation = await prisma.supportConversation.findFirst({ where: { userId: session.id, status: "OPEN" }, orderBy: { lastMessageAt: "desc" }, include: { messages: { orderBy: { createdAt: "asc" }, take: 100 } } });
  return NextResponse.json({ currentUserId: session.id, conversation: conversation ? { id: conversation.id, status: conversation.status } : null, messages: conversation?.messages ?? [] });
}

export async function POST(request: Request) {
  const session = await requireApiUserSession();
  if (!session) return NextResponse.json({ error: "Please sign in to contact support." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { body?: string } | null;
  const body = payload?.body?.trim();
  if (!body || body.length > 2000) return NextResponse.json({ error: "Messages must be between 1 and 2,000 characters." }, { status: 400 });
  await prisma.$transaction(async (tx) => {
    const conversation = await tx.supportConversation.findFirst({ where: { userId: session.id, status: "OPEN" }, orderBy: { lastMessageAt: "desc" } });
    const activeConversation = conversation ?? await tx.supportConversation.create({ data: { userId: session.id } });
    await tx.supportMessage.create({ data: { conversationId: activeConversation.id, senderId: session.id, body } });
    await tx.supportConversation.update({ where: { id: activeConversation.id }, data: { lastMessageAt: new Date() } });
  });
  return NextResponse.json({ ok: true });
}
