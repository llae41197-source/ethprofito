"use client";

import { FormEvent, useState } from "react";

type AuthMode = "login" | "register";

type AuthFormProps = {
  nextPath?: string;
};

export function AuthForm({ nextPath }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  async function connectWallet() {
    setWalletLoading(true);
    setError(null);

    try {
      const provider = (window as Window & {
        ethereum?: {
          request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
      }).ethereum;

      if (!provider) {
        setError("No compatible browser wallet was found. Open this in MetaMask or another injected wallet browser.");
        setWalletLoading(false);
        return;
      }

      const accounts = (await provider.request({
        method: "eth_requestAccounts"
      })) as string[];

      const address = accounts?.[0];

      if (!address) {
        setError("No wallet account was returned.");
        setWalletLoading(false);
        return;
      }

      const challengeResponse = await fetch("/api/auth/wallet/challenge", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ address })
      });

      const challengeResult = (await challengeResponse.json().catch(() => null)) as
        | { error?: string; message?: string; address?: string }
        | null;

      if (!challengeResponse.ok || !challengeResult?.message || !challengeResult?.address) {
        setError(challengeResult?.error ?? "Could not start wallet sign-in.");
        setWalletLoading(false);
        return;
      }

      const signature = (await provider.request({
        method: "personal_sign",
        params: [challengeResult.message, challengeResult.address]
      })) as string;

      const verifyResponse = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: challengeResult.address,
          signature,
          next: nextPath
        })
      });

      const verifyResult = (await verifyResponse.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null;

      if (!verifyResponse.ok) {
        setError(verifyResult?.error ?? "Wallet sign-in failed.");
        setWalletLoading(false);
        return;
      }

      window.location.href = verifyResult?.redirectTo ?? "/wallet";
    } catch {
      setError("Wallet sign-in was cancelled or failed.");
      setWalletLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email, password, next: nextPath }
        : {
            name,
            email,
            password
          };

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string; redirectTo?: string }
      | null;

    if (!response.ok) {
      setError(result?.error ?? "Authentication failed.");
      setLoading(false);
      return;
    }

    window.location.href = result?.redirectTo ?? "/wallet";
  }

  return (
    <div className="panel auth-shell">
      <div className="auth-toggle">
        <button
          type="button"
          className={mode === "login" ? "auth-toggle-active" : ""}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "register" ? "auth-toggle-active" : ""}
          onClick={() => setMode("register")}
        >
          Create account
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>

        <button type="button" className="btn-secondary" disabled={walletLoading} onClick={connectWallet}>
          {walletLoading ? "Connecting wallet..." : "Connect browser wallet"}
        </button>
      </form>
    </div>
  );
}
