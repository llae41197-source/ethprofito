"use client";

import { FormEvent, useMemo, useState } from "react";
import { binaryOptionRules } from "@/lib/data";

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
  const [durationSeconds, setDurationSeconds] = useState<number>(binaryOptionRules[0].durationSeconds);

  const activeRule = useMemo(
    () =>
      binaryOptionRules.find((rule) => rule.durationSeconds === durationSeconds) ?? binaryOptionRules[0],
    [durationSeconds]
  );

  const usdtBalance =
    balances.find((balance) => balance.asset.symbol === "USDT")?.amount ?? 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/binary-options", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assetSymbol: form.get("assetSymbol"),
        direction: form.get("direction"),
        durationSeconds: Number(form.get("durationSeconds")),
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
          <select
            name="durationSeconds"
            required
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
          >
            {binaryOptionRules.map((rule) => (
              <option key={rule.durationSeconds} value={rule.durationSeconds}>
                {rule.durationSeconds}s
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Payout %</span>
          <input value={`${activeRule.payoutPercent}%`} readOnly />
        </label>

        <label className="field">
          <span>Stake amount (USDT)</span>
          <input
            name="stakeAmount"
            type="number"
            step="0.01"
            min={activeRule.minimumStake}
            placeholder={`Minimum ${activeRule.minimumStake} USDT`}
            required
          />
        </label>

        <div className="panel" style={{ padding: "0.9rem" }}>
          <p className="muted small" style={{ margin: 0 }}>
            Market rule: {activeRule.durationSeconds}s returns {activeRule.payoutPercent}% profit with a
            minimum trade of {activeRule.minimumStake.toLocaleString()} USDT.
          </p>
          <p className="muted small" style={{ margin: "0.5rem 0 0" }}>
            Available USDT: {Number(usdtBalance).toFixed(4)}
          </p>
          <p className="muted small" style={{ margin: "0.5rem 0 0" }}>
            Other balances:{" "}
            {balances
              .filter((balance) => balance.asset.symbol !== "USDT")
              .map((balance) => `${balance.asset.symbol} ${Number(balance.amount).toFixed(4)}`)
              .join(", ") || "None"}
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
