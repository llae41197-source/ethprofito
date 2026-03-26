"use client";

import { useActionState } from "react";
import { submitDepositProof, type DepositFormState } from "@/app/deposit/actions";

type DepositAddressRow = {
  symbol: string;
  chain: string;
};

type DepositUploadFormProps = {
  depositAddresses: DepositAddressRow[];
};

export function DepositUploadForm({ depositAddresses }: DepositUploadFormProps) {
  const initialState: DepositFormState = {};
  const [state, formAction, pending] = useActionState(submitDepositProof, initialState);

  return (
    <article className="panel">
      <p className="muted-label">Upload transaction proof</p>
      <form className="admin-form" action={formAction}>
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
          <textarea name="note" />
        </label>

        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Uploading..." : "Submit deposit proof"}
        </button>
      </form>

      {state.error ? (
        <p className="form-error" style={{ marginTop: "1rem" }}>
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="muted" style={{ marginTop: "1rem" }}>
          {state.success}
        </p>
      ) : null}
    </article>
  );
}
