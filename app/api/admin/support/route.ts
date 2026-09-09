import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const agent = await requireApiAdminSession();
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const conversations = await prisma.supportConversation.findMany({
    where: { status: "OPEN" },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 100 }
    }
  });
  return NextResponse.json({ conversations, currentUserId: agent.id });
}

export async function POST(request: Request) {
  const agent = await requireApiAdminSession();
  if (!agent) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const payload = (await request.json().catch(() => null)) as { conversationId?: string; body?: string } | null;
  const conversationId = payload?.conversationId?.trim();
  const body = payload?.body?.trim();
  if (!conversationId || !body || body.length > 2000) return NextResponse.json({ error: "A conversation and a message of up to 2,000 characters are required." }, { status: 400 });

  const conversation = await prisma.supportConversation.findFirst({ where: { id: conversationId, status: "OPEN" } });
  if (!conversation) return NextResponse.json({ error: "This conversation is no longer open." }, { status: 404 });

  await prisma.$transaction([
    prisma.supportMessage.create({ data: { conversationId, senderId: agent.id, body } }),
    prisma.supportConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })
  ]);
  return NextResponse.json({ ok: true });
}
