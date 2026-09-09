"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Conversation = {
  id: string;
  status: string;
  lastMessageAt: string | Date;
  user: { name: string | null; email: string };
  messages: Array<{ id: string; body: string; senderId: string; createdAt: string | Date }>;
};

export function SupportInbox({ conversations, currentUserId }: { conversations: Conversation[]; currentUserId: string }) {
  const [items, setItems] = useState(conversations);
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = items.find((conversation) => conversation.id === selectedId);

  const refreshConversations = useCallback(async () => {
    const response = await fetch("/api/admin/support", { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { conversations: Conversation[] };
    setItems(data.conversations);
    setSelectedId((id) => data.conversations.some((conversation) => conversation.id === id) ? id : (data.conversations[0]?.id ?? ""));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => void refreshConversations(), 8000);
    return () => window.clearInterval(interval);
  }, [refreshConversations]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    setBusy(true); setError("");
    const response = await fetch("/api/admin/support", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, body: body.trim() }) });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) { setError(result?.error ?? "Unable to send reply."); setBusy(false); return; }
    window.location.reload();
  }

  return <article className="panel support-inbox">
    <div className="section-head"><div><p className="muted-label">Live customer service</p><p className="muted">Open conversations are refreshed when this page reloads.</p></div></div>
    {items.length === 0 ? <p className="muted">No open customer conversations.</p> : <div className="support-inbox-layout">
      <div className="support-inbox-list">{items.map((conversation) => <button key={conversation.id} type="button" className={`support-inbox-item ${conversation.id === selectedId ? "is-selected" : ""}`} onClick={() => setSelectedId(conversation.id)}><strong>{conversation.user.name ?? conversation.user.email}</strong><span>{conversation.user.email}</span><small>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(conversation.lastMessageAt))}</small></button>)}</div>
      {selected ? <div className="support-inbox-thread"><div className="support-messages support-messages-admin">{selected.messages.map((message) => <div key={message.id} className={`support-message ${message.senderId === currentUserId ? "support-message-own" : "support-message-agent"}`}><p>{message.body}</p><span>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</span></div>)}</div><form className="support-compose" onSubmit={sendReply}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Reply to customer…" maxLength={2000} required /><button className="btn" disabled={busy} type="submit">{busy ? "Sending…" : "Send reply"}</button></form>{error ? <p className="form-error">{error}</p> : null}</div> : null}
    </div>}
  </article>;
}
