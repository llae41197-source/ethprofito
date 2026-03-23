"use client";

import { useMemo, useState } from "react";

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
  network: string;
  txHash: string | null;
  note: string | null;
  status: string;
  adminNote: string | null;
  screenshotData: string | null;
  createdAt?: string | Date;
  user: {
    id: string;
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

type WithdrawalRequest = {
  id: string;
  amount: number | string;
  destination: string;
  network: string;
  note: string | null;
  status: string;
  adminNote: string | null;
  createdAt?: string | Date;
  user: {
    id: string;
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
  withdrawalRequests: WithdrawalRequest[];
};

export function AdminActions({
  users,
  depositSubmissions,
  binaryOptions,
  withdrawalRequests
}: AdminActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const supportedAssets = useMemo(() => {
    const symbols = new Set(["BTC", "ETH", "SOL", "USDT", "XAU"]);
    users.forEach((user) => {
      user.balances.forEach((balance) => symbols.add(balance.asset.symbol));
    });
    return Array.from(symbols).sort();
  }, [users]);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const text = `${user.name ?? ""} ${user.email} ${user.role} ${user.kycStatus}`.toLowerCase();
      return text.includes(query);
    });
  }, [search, users]);

  function formatDateTime(value?: string | Date) {
    if (!value) {
      return "Not available";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  }

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

  async function setUserState(userId: string, restricted: boolean, kycStatus: string) {
    const ok = await requestJson(`/api/admin/users/${userId}/status`, {
      restricted,
      kycStatus
    });

    if (ok) {
      setMessage("User updated.");
      window.location.reload();
    }
  }

  async function recordAdjustment(formData: FormData) {
    const ok = await requestJson("/api/admin/balances/adjust", {
      userId: formData.get("userId"),
      assetSymbol: formData.get("assetSymbol"),
      amount: Number(formData.get("amount")),
      note: formData.get("note")
    });

    if (ok) {
      setMessage("Balance adjustment recorded.");
      window.location.reload();
    }
  }

  async function reviewDeposit(depositId: string, status: "APPROVED" | "REJECTED") {
    const ok = await requestJson(`/api/admin/deposits/${depositId}/review`, {
      status,
      adminNote: `Admin marked deposit as ${status.toLowerCase()}.`
    });

    if (ok) {
      setMessage(`Deposit ${status.toLowerCase()}.`);
      window.location.reload();
    }
  }

  async function reviewWithdrawal(requestId: string, status: "APPROVED" | "REJECTED") {
    const ok = await requestJson(`/api/admin/withdrawals/${requestId}/review`, {
      status,
      adminNote: `Admin marked withdrawal as ${status.toLowerCase()}.`
    });

    if (ok) {
      setMessage(`Withdrawal ${status.toLowerCase()}.`);
      window.location.reload();
    }
  }

  async function settleOption(optionId: string, outcome: "WON" | "LOST" | "CANCELLED", openingPrice: number | string) {
    const ok = await requestJson(`/api/admin/binary-options/${optionId}/settle`, {
      outcome,
      closingPrice: Number(openingPrice),
      adminNote: `Admin settled option as ${outcome.toLowerCase()}.`
    });

    if (ok) {
      setMessage(`Binary option settled as ${outcome.toLowerCase()}.`);
      window.location.reload();
    }
  }

  return (
    <div className="stack">
      <article className="panel">
        <p className="muted-label">Manual balance adjustment</p>
        <form
          className="admin-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await recordAdjustment(new FormData(event.currentTarget));
          }}
        >
          <div className="grid-3">
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
              <span>Asset</span>
              <select name="assetSymbol" defaultValue="USDT" required>
                {supportedAssets.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Amount</span>
              <input name="amount" type="number" step="0.0001" required />
            </label>
          </div>

          <label className="field">
            <span>Reason</span>
            <textarea name="note" required />
          </label>

          <button type="submit" className="btn" disabled={busy}>
            Record adjustment
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-head">
          <div>
            <p className="muted-label">Users</p>
          </div>
        </div>
        <label className="field" style={{ marginBottom: "1rem" }}>
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, or role"
          />
        </label>
        <div className="admin-grid-cards">
          {visibleUsers.map((user) => (
            <article key={user.id} className="admin-detail-card">
              <div className="admin-card-head">
                <div>
                  <strong>{user.name ?? user.email}</strong>
                  <div className="muted small">{user.email}</div>
                </div>
                <span className={`badge ${user.isRestricted ? "danger" : ""}`}>{user.role}</span>
              </div>
              <div className="detail-list">
                <div><span className="muted small">KYC</span><strong>{user.kycStatus}</strong></div>
                <div><span className="muted small">Restriction</span><strong>{user.isRestricted ? "Restricted" : "Active"}</strong></div>
                <div>
                  <span className="muted small">Balances</span>
                  <strong>
                    {user.balances.length > 0
                      ? user.balances
                          .map((balance) => `${balance.asset.symbol} ${Number(balance.amount).toFixed(2)}`)
                          .join(", ")
                      : "No balances"}
                  </strong>
                </div>
              </div>
              <div className="action-row">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => setUserState(user.id, false, "APPROVED")}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => setUserState(user.id, false, "REJECTED")}
                >
                  Rejected
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => setUserState(user.id, true, user.kycStatus)}
                >
                  Restricted
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <p className="muted-label">Deposit requests</p>
        <div className="table-shell" style={{ marginTop: "1rem" }}>
          {depositSubmissions.length === 0 ? (
            <p className="muted">No deposit submissions found.</p>
          ) : (
            <table className="table admin-request-table">
              <thead>
                <tr>
                  <th>User / Time</th>
                  <th>Asset / Amount</th>
                  <th>Network / Tx</th>
                  <th>Notes</th>
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {depositSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <strong>{submission.user.name ?? submission.user.email}</strong>
                      <div className="muted small">{submission.user.email}</div>
                      <div className="muted small">{formatDateTime(submission.createdAt)}</div>
                    </td>
                    <td>
                      <strong>{submission.asset.symbol}</strong>
                      <div className="muted small">{submission.amount.toString()}</div>
                    </td>
                    <td>
                      <strong>{submission.network}</strong>
                      <div className="muted small">{submission.txHash ?? "No tx hash"}</div>
                    </td>
                    <td>
                      <div className="muted small">{submission.note ?? "No user note"}</div>
                      <div className="muted small">{submission.adminNote ?? "No admin note"}</div>
                    </td>
                    <td>
                      {submission.screenshotData ? (
                        <a href={submission.screenshotData} target="_blank" rel="noreferrer">
                          Open proof
                        </a>
                      ) : (
                        <span className="muted">No image</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          submission.status === "REJECTED"
                            ? "danger"
                            : submission.status === "PENDING"
                              ? "warn"
                              : ""
                        }`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-row action-row-compact">
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || submission.status !== "PENDING"}
                          onClick={() => reviewDeposit(submission.id, "APPROVED")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || submission.status !== "PENDING"}
                          onClick={() => reviewDeposit(submission.id, "REJECTED")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || submission.user.email === "admin@ethprofito.com"}
                          onClick={() => setUserState(submission.user.id, true, "PENDING")}
                        >
                          Restrict
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <article className="panel">
        <p className="muted-label">Withdrawal requests</p>
        <div className="table-shell" style={{ marginTop: "1rem" }}>
          {withdrawalRequests.length === 0 ? (
            <p className="muted">No withdrawal requests found.</p>
          ) : (
            <table className="table admin-request-table">
              <thead>
                <tr>
                  <th>User / Time</th>
                  <th>Asset / Amount</th>
                  <th>Network / Destination</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.user.name ?? request.user.email}</strong>
                      <div className="muted small">{request.user.email}</div>
                      <div className="muted small">{formatDateTime(request.createdAt)}</div>
                    </td>
                    <td>
                      <strong>{request.asset.symbol}</strong>
                      <div className="muted small">{request.amount.toString()}</div>
                    </td>
                    <td>
                      <strong>{request.network}</strong>
                      <div className="muted small">{request.destination}</div>
                    </td>
                    <td>
                      <div className="muted small">{request.note ?? "No user note"}</div>
                      <div className="muted small">{request.adminNote ?? "No admin note"}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          request.status === "REJECTED"
                            ? "danger"
                            : request.status === "PENDING"
                              ? "warn"
                              : ""
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-row action-row-compact">
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || request.status !== "PENDING"}
                          onClick={() => reviewWithdrawal(request.id, "APPROVED")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || request.status !== "PENDING"}
                          onClick={() => reviewWithdrawal(request.id, "REJECTED")}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy || request.user.email === "admin@ethprofito.com"}
                          onClick={() => setUserState(request.user.id, true, "PENDING")}
                        >
                          Restrict
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>

      <article className="panel">
        <p className="muted-label">Binary options</p>
        <div className="admin-grid-cards">
          {binaryOptions.length === 0 ? (
            <p className="muted">No binary option tickets found.</p>
          ) : (
            binaryOptions.map((option) => (
              <article key={option.id} className="admin-detail-card">
                <div className="admin-card-head">
                  <div>
                    <strong>{option.user.name ?? option.user.email}</strong>
                    <div className="muted small">{option.user.email}</div>
                  </div>
                  <span className={`badge ${option.status === "LOST" ? "danger" : option.status === "OPEN" ? "warn" : ""}`}>
                    {option.status}
                  </span>
                </div>
                <div className="detail-list">
                  <div><span className="muted small">Asset</span><strong>{option.asset.symbol}</strong></div>
                  <div><span className="muted small">Direction</span><strong>{option.direction}</strong></div>
                  <div><span className="muted small">Duration</span><strong>{option.durationSeconds}s</strong></div>
                  <div><span className="muted small">Payout</span><strong>{option.payoutPercent}%</strong></div>
                  <div><span className="muted small">Capital</span><strong>{option.stakeAmount.toString()} USDT</strong></div>
                  <div><span className="muted small">Opening price</span><strong>{option.openingPrice.toString()}</strong></div>
                </div>
                <div className="action-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || option.status !== "OPEN"}
                    onClick={() => settleOption(option.id, "WON", option.openingPrice)}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || option.status !== "OPEN"}
                    onClick={() => settleOption(option.id, "LOST", option.openingPrice)}
                  >
                    Rejected
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || option.status !== "OPEN"}
                    onClick={() => settleOption(option.id, "CANCELLED", option.openingPrice)}
                  >
                    Restricted
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </article>

      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
