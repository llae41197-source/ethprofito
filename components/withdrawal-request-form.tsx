"use client";

import { FormEvent, useState } from "react";

type BalanceRow = {
  asset: {
    symbol: string;
    name: string;
  };
  amount: number;
};

type Props = {
  balances: BalanceRow[];
};

export function WithdrawalRequestForm({ balances }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetSymbol: form.get("assetSymbol"),
        amount: Number(form.get("amount")),
        network: form.get("network"),
        destination: form.get("destination"),
        note: form.get("note")
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.error ?? "Unable to create withdrawal request.");
      setBusy(false);
      return;
    }

    setMessage(result?.message ?? "Withdrawal request submitted.");
    setBusy(false);
    window.location.reload();
  }

  return (
    <article className="panel">
      <p className="muted-label">Withdrawal request</p>
      <form className="admin-form" onSubmit={onSubmit}>
        <label className="field">
          <span>Asset</span>
          <select name="assetSymbol" required>
            {balances.map((balance) => (
              <option key={balance.asset.symbol} value={balance.asset.symbol}>
                {balance.asset.symbol} ({balance.amount.toFixed(4)} available)
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Amount</span>
          <input name="amount" type="number" step="0.0001" min="0" required />
        </label>
        <label className="field">
          <span>Network</span>
          <input name="network" placeholder="Bitcoin / Ethereum / Solana" required />
        </label>
        <label className="field">
          <span>Destination wallet</span>
          <input name="destination" required />
        </label>
        <label className="field">
          <span>Note</span>
          <textarea name="note" />
        </label>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Submitting..." : "Submit withdrawal"}
        </button>
      </form>
      {message ? <p className="muted" style={{ marginTop: "1rem" }}>{message}</p> : null}
    </article>
  );
}
