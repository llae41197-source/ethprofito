"use client";

import { FormEvent, useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isRestricted: boolean;
  kycStatus: string;
  balances: Array<{
    id: string;
    amount: number | string;
    asset: {
      symbol: string;
    };
  }>;
};

type AdminActionsProps = {
  users: AdminUser[];
};

export function AdminActions({ users }: AdminActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitUserStatus(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restricted: form.get("restricted") === "true",
        kycStatus: form.get("kycStatus")
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to update user status.");
      setBusy(false);
      return;
    }

    setMessage("User status updated.");
    setBusy(false);
    window.location.reload();
  }

  async function submitBalanceAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/balances/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.get("userId"),
        assetSymbol: form.get("assetSymbol"),
        amount: Number(form.get("amount")),
        note: form.get("note")
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to adjust balance.");
      setBusy(false);
      return;
    }

    setMessage("Balance adjustment recorded.");
    setBusy(false);
    window.location.reload();
  }

  return (
    <div className="admin-actions-shell stack">
      <article className="panel">
        <p className="muted-label">Admin-only balance controls</p>
        <form className="admin-form" onSubmit={submitBalanceAdjustment}>
          <label className="field">
            <span>User</span>
            <select name="userId" required>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Asset symbol</span>
            <input name="assetSymbol" placeholder="BTC" required />
          </label>

          <label className="field">
            <span>Adjustment amount</span>
            <input name="amount" type="number" step="0.0001" required />
          </label>

          <label className="field">
            <span>Reason / audit note</span>
            <textarea name="note" required />
          </label>

          <button type="submit" className="btn" disabled={busy}>
            Record adjustment
          </button>
        </form>
      </article>

      <article className="panel">
        <p className="muted-label">User permissions</p>
        <div className="admin-grid">
          {users.map((user) => (
            <div key={user.id} className="admin-user-card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <strong>{user.name ?? user.email}</strong>
                  <div className="muted small">{user.email}</div>
                </div>
                <span className={`badge ${user.isRestricted ? "danger" : ""}`}>{user.role}</span>
              </div>

              <p className="muted small" style={{ marginBottom: "0.5rem" }}>
                Balances:{" "}
                {user.balances.length > 0
                  ? user.balances
                      .map((balance) => `${balance.asset.symbol} ${Number(balance.amount).toFixed(4)}`)
                      .join(", ")
                  : "No balances"}
              </p>

              <form className="admin-form" onSubmit={(event) => submitUserStatus(event, user.id)}>
                <label className="field">
                  <span>Restriction</span>
                  <select name="restricted" defaultValue={user.isRestricted ? "true" : "false"}>
                    <option value="false">Active</option>
                    <option value="true">Restricted</option>
                  </select>
                </label>

                <label className="field">
                  <span>KYC status</span>
                  <select name="kycStatus" defaultValue={user.kycStatus}>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REVIEW">Review</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>

                <button type="submit" className="btn-secondary" disabled={busy}>
                  Save user controls
                </button>
              </form>
            </div>
          ))}
        </div>
      </article>

      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
