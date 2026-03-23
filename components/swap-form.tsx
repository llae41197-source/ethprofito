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

export function SwapForm({ balances }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/swaps", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAssetSymbol: form.get("fromAssetSymbol"),
        toAssetSymbol: form.get("toAssetSymbol"),
        fromAmount: Number(form.get("fromAmount"))
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setMessage(result?.error ?? "Swap failed.");
      setBusy(false);
      return;
    }

    setMessage(result?.message ?? "Swap completed.");
    setBusy(false);
    window.location.reload();
  }

  return (
    <article className="panel">
      <p className="muted-label">Currency swap</p>
      <form className="admin-form" onSubmit={onSubmit}>
        <label className="field">
          <span>From asset</span>
          <select name="fromAssetSymbol" required>
            {balances.map((balance) => (
              <option key={balance.asset.symbol} value={balance.asset.symbol}>
                {balance.asset.symbol} ({balance.amount.toFixed(4)})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>To asset</span>
          <select name="toAssetSymbol" required defaultValue="USDT">
            {["BTC", "ETH", "SOL", "USDT", "XAU"].map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Amount</span>
          <input name="fromAmount" type="number" step="0.0001" min="0" required />
        </label>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Swapping..." : "Swap assets"}
        </button>
      </form>
      {message ? <p className="muted" style={{ marginTop: "1rem" }}>{message}</p> : null}
    </article>
  );
}
