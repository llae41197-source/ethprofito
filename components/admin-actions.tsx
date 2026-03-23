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
    amount: number;
    lockedAmount: number;
    asset: {
      symbol: string;
    };
  }>;
};

type DepositSubmission = {
  id: string;
  amount: number | string;
  txHash: string | null;
  status: string;
  adminNote: string | null;
  screenshotData: string | null;
  user: {
    email: string;
    name: string | null;
  };
  asset: {
    symbol: string;
  };
};

type BinaryOption = {
  id: string;
  direction: string;
  durationSeconds: number;
  payoutPercent: number;
  stakeAmount: number | string;
  openingPrice: number | string;
  status: string;
  user: {
    email: string;
    name: string | null;
  };
  asset: {
    symbol: string;
  };
};

type AdminActionsProps = {
  users: AdminUser[];
  depositSubmissions: DepositSubmission[];
  binaryOptions: BinaryOption[];
};

export function AdminActions({ users, depositSubmissions, binaryOptions }: AdminActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestJson(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(result?.error ?? "Request failed.");
      setBusy(false);
      return false;
    }

    setBusy(false);
    return true;
  }

  async function submitUserStatus(event: FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await requestJson(`/api/admin/users/${userId}/status`, {
      restricted: form.get("restricted") === "true",
      kycStatus: form.get("kycStatus")
    });

    if (ok) {
      setMessage("User status updated.");
      window.location.reload();
    }
  }

  async function submitBalanceAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await requestJson("/api/admin/balances/adjust", {
      userId: form.get("userId"),
      assetSymbol: form.get("assetSymbol"),
      amount: Number(form.get("amount")),
      note: form.get("note")
    });

    if (ok) {
      setMessage("Balance adjustment recorded.");
      window.location.reload();
    }
  }

  async function reviewDeposit(event: FormEvent<HTMLFormElement>, depositId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await requestJson(`/api/admin/deposits/${depositId}/review`, {
      status: form.get("status"),
      adminNote: form.get("adminNote")
    });

    if (ok) {
      setMessage("Deposit review saved.");
      window.location.reload();
    }
  }

  async function settleBinaryOption(event: FormEvent<HTMLFormElement>, optionId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await requestJson(`/api/admin/binary-options/${optionId}/settle`, {
      outcome: form.get("outcome"),
      closingPrice: Number(form.get("closingPrice")),
      adminNote: form.get("adminNote")
    });

    if (ok) {
      setMessage("Binary option settled.");
      window.location.reload();
    }
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
                      .map(
                        (balance) =>
                          `${balance.asset.symbol} ${Number(balance.amount).toFixed(4)} / locked ${Number(balance.lockedAmount).toFixed(4)}`
                      )
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

      <article className="panel">
        <p className="muted-label">Pending deposit screenshot reviews</p>
        <div className="admin-grid">
          {depositSubmissions.length === 0 ? (
            <p className="muted">No deposit submissions found.</p>
          ) : (
            depositSubmissions.map((submission) => (
              <div key={submission.id} className="admin-user-card">
                <strong>{submission.user.name ?? submission.user.email}</strong>
                <p className="muted small">
                  {submission.asset.symbol} {submission.amount.toString()} | {submission.txHash ?? "No tx hash"}
                </p>
                {submission.screenshotData ? (
                  <a href={submission.screenshotData} target="_blank" rel="noreferrer">
                    Open screenshot proof
                  </a>
                ) : (
                  <p className="muted small">No screenshot attached.</p>
                )}

                <form className="admin-form" onSubmit={(event) => reviewDeposit(event, submission.id)}>
                  <label className="field">
                    <span>Status</span>
                    <select name="status" defaultValue={submission.status}>
                      <option value="APPROVED">Approve</option>
                      <option value="REJECTED">Reject</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Admin note</span>
                    <textarea name="adminNote" defaultValue={submission.adminNote ?? ""} />
                  </label>

                  <button type="submit" className="btn-secondary" disabled={busy || submission.status !== "PENDING"}>
                    {submission.status === "PENDING" ? "Save deposit review" : `Already ${submission.status}`}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="panel">
        <p className="muted-label">Binary option settlement desk</p>
        <div className="admin-grid">
          {binaryOptions.length === 0 ? (
            <p className="muted">No binary option tickets found.</p>
          ) : (
            binaryOptions.map((option) => (
              <div key={option.id} className="admin-user-card">
                <strong>{option.user.name ?? option.user.email}</strong>
                <p className="muted small">
                  {option.asset.symbol} {option.direction} {option.durationSeconds}s @ {option.payoutPercent}% | stake{" "}
                  {option.stakeAmount.toString()} | open {option.openingPrice.toString()}
                </p>

                <form className="admin-form" onSubmit={(event) => settleBinaryOption(event, option.id)}>
                  <label className="field">
                    <span>Outcome</span>
                    <select name="outcome" defaultValue="WON">
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                      <option value="CANCELLED">Cancelled / refund</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Closing price</span>
                    <input name="closingPrice" type="number" step="0.0001" required />
                  </label>

                  <label className="field">
                    <span>Admin note</span>
                    <textarea name="adminNote" />
                  </label>

                  <button type="submit" className="btn-secondary" disabled={busy || option.status !== "OPEN"}>
                    {option.status === "OPEN" ? "Settle option" : `Already ${option.status}`}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </article>

      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
