"use client";

import { FormEvent, useState } from "react";

type DepositAddressRow = {
  symbol: string;
  chain: string;
};

type DepositUploadFormProps = {
  depositAddresses: DepositAddressRow[];
};

export function DepositUploadForm({ depositAddresses }: DepositUploadFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/deposits", {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response.ok) {
      setMessage(result?.error ?? "Unable to submit deposit proof.");
      setBusy(false);
      return;
    }

    setMessage(result?.message ?? "Deposit proof submitted.");
    setBusy(false);
    window.location.reload();
  }

  return (
    <article className="panel">
      <p className="muted-label">Upload transaction proof</p>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Asset</span>
          <select name="assetSymbol" required>
            {depositAddresses.map((item) => (
              <option key={item.symbol} value={item.symbol}>
                {item.symbol} on {item.chain}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Network</span>
          <input name="network" placeholder="Bitcoin / Ethereum / Solana" required />
        </label>

        <label className="field">
          <span>Amount sent</span>
          <input name="amount" type="number" step="0.00000001" min="0" required />
        </label>

        <label className="field">
          <span>Transaction hash</span>
          <input name="txHash" placeholder="Optional but recommended" />
        </label>

        <label className="field">
          <span>Screenshot proof</span>
          <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp" required />
        </label>

        <label className="field">
          <span>Note</span>
          <textarea name="note" placeholder="Anything the admin should verify" />
        </label>

        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Uploading..." : "Submit deposit proof"}
        </button>
      </form>

      {message ? <p className="muted" style={{ marginTop: "1rem" }}>{message}</p> : null}
    </article>
  );
}
