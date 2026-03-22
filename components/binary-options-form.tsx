"use client";

import { FormEvent, useState } from "react";
import { binaryDurations, binaryPayoutPercents } from "@/lib/data";

type BalanceRow = {
  asset: {
    symbol: string;
    name: string;
  };
  amount: number | string;
};

type MarketRow = {
  symbol: string;
  name: string;
};

type BinaryOptionsFormProps = {
  balances: BalanceRow[];
  markets: MarketRow[];
};

export function BinaryOptionsForm({ balances, markets }: BinaryOptionsFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/binary-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetSymbol: form.get("assetSymbol"),
        direction: form.get("direction"),
        durationSeconds: Number(form.get("durationSeconds")),
        payoutPercent: Number(form.get("payoutPercent")),
        stakeAmount: Number(form.get("stakeAmount"))
      })
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to place binary option order.");
      setBusy(false);
      return;
    }

    setMessage(result?.message ?? "Binary option ticket created.");
    setBusy(false);
    window.location.reload();
  }

  return (
    <article className="panel">
      <p className="muted-label">Binary options order ticket</p>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Trading market</span>
          <select name="assetSymbol" required>
            {markets.map((market) => (
              <option key={market.symbol} value={market.symbol}>
                {market.name} ({market.symbol})
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Direction</span>
          <select name="direction" required>
            <option value="CALL">Call / Up</option>
            <option value="PUT">Put / Down</option>
          </select>
        </label>

        <label className="field">
          <span>Duration</span>
          <select name="durationSeconds" required>
            {binaryDurations.map((duration) => (
              <option key={duration} value={duration}>
                {duration}s
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Payout %</span>
          <select name="payoutPercent" required>
            {binaryPayoutPercents.map((percent) => (
              <option key={percent} value={percent}>
                {percent}%
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Stake amount</span>
          <input name="stakeAmount" type="number" step="0.01" min="1" required />
        </label>

        <div className="panel" style={{ padding: "0.9rem" }}>
          <p className="muted small" style={{ margin: 0 }}>
            Available balances:{" "}
            {balances
              .map((balance) => `${balance.asset.symbol} ${Number(balance.amount).toFixed(4)}`)
              .join(", ")}
          </p>
        </div>

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Placing..." : "Place binary option"}
        </button>
      </form>

      {message ? <p className="muted" style={{ marginTop: "1rem" }}>{message}</p> : null}
    </article>
  );
}
