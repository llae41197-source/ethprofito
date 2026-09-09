"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Message = { id: string; body: string; senderId: string; createdAt: string };
type SupportResponse = { conversation: { id: string; status: string } | null; messages: Message[]; currentUserId: string };

export function SupportFloat() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [conversation, setConversation] = useState<SupportResponse["conversation"]>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadChat = useCallback(async () => {
    const response = await fetch("/api/support", { credentials: "include", cache: "no-store" });
    if (response.status === 401) { setAuthenticated(false); setLoading(false); return; }
    if (!response.ok) { setError("Customer service is temporarily unavailable."); setLoading(false); return; }
    const data = (await response.json()) as SupportResponse;
    setAuthenticated(true); setConversation(data.conversation); setMessages(data.messages); setCurrentUserId(data.currentUserId); setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void loadChat();
    const interval = window.setInterval(() => void loadChat(), 8000);
    return () => window.clearInterval(interval);
  }, [loadChat, open]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = message.trim();
    if (!body) return;
    setError("");
    const response = await fetch("/api/support", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) { setError(result?.error ?? "Unable to send your message."); return; }
    setMessage("");
    await loadChat();
  }

  return (
    <div className="support-widget">
      {open ? <section className="support-panel" aria-label="Customer service chat">
        <div className="support-panel-head"><div><strong>Customer Service</strong><span>{conversation?.status === "OPEN" ? "Typically replies during business hours" : "Start a conversation with our team"}</span></div><button className="support-close" type="button" onClick={() => setOpen(false)} aria-label="Close customer service chat">×</button></div>
        {!authenticated ? <div className="support-empty"><p>Please sign in to start a secure support conversation about your account.</p><Link className="btn" href="/login">Sign in to chat</Link></div> : loading ? <div className="support-empty">Loading conversation…</div> : <><div className="support-messages" aria-live="polite">{messages.length === 0 ? <div className="support-empty">How can we help? Send a message and our support team will reply here.</div> : messages.map((item) => <div key={item.id} className={`support-message ${item.senderId === currentUserId ? "support-message-own" : "support-message-agent"}`}><p>{item.body}</p><span>{new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt))}</span></div>)}</div><form className="support-compose" onSubmit={sendMessage}><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="Write your message…" aria-label="Message customer service" required /><button className="btn" type="submit">Send</button></form></>}
        {error ? <p className="form-error">{error}</p> : null}
      </section> : null}
      <button className="support-float" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open customer service chat" title="Customer service"><span className="support-float-icon" aria-hidden="true">🎧</span><span className="support-float-label">Customer Service</span></button>
    </div>
  );
}
