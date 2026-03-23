"use client";

import { FormEvent, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";

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
  const { connectors, connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { address: connectedAddress } = useAccount();

  const walletConnectConnector = connectors.find((connector) => connector.id === "walletConnect");
  const injectedConnector = connectors.find((connector) => connector.id === "injected");
  const coinbaseConnector = connectors.find((connector) => connector.id === "coinbaseWalletSDK");

  async function connectWallet(connectorId: "injected" | "coinbaseWalletSDK" | "walletConnect") {
    setWalletLoading(true);
    setError(null);

    try {
      const connector = connectors.find((item) => item.id === connectorId);

      if (!connector) {
        setError(
          connectorId === "walletConnect"
            ? "WalletConnect is not configured yet. Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID first."
            : "This wallet option is not available on this device."
        );
        setWalletLoading(false);
        return;
      }

      if (connectedAddress) {
        await disconnectAsync().catch(() => undefined);
      }

      const result = await connectAsync({ connector });
      const address = result.accounts?.[0];

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
        body: JSON.stringify({ address, chainId: result.chainId })
      });

      const challengeResult = (await challengeResponse.json().catch(() => null)) as
        | { error?: string; message?: string; address?: string }
        | null;

      if (!challengeResponse.ok || !challengeResult?.message || !challengeResult?.address) {
        setError(challengeResult?.error ?? "Could not start wallet sign-in.");
        setWalletLoading(false);
        return;
      }

      const signature = await signMessageAsync({
        account: challengeResult.address as `0x${string}`,
        message: challengeResult.message
      });

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

        <div className="wallet-auth-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={walletLoading || !injectedConnector}
            onClick={() => connectWallet("injected")}
          >
            {walletLoading ? "Connecting wallet..." : "Browser wallet"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={walletLoading || !coinbaseConnector}
            onClick={() => connectWallet("coinbaseWalletSDK")}
          >
            {walletLoading ? "Connecting wallet..." : "Onchain / Coinbase"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={walletLoading || !walletConnectConnector}
            onClick={() => connectWallet("walletConnect")}
          >
            {walletLoading ? "Connecting wallet..." : "Trust / WalletConnect"}
          </button>
        </div>
      </form>
    </div>
  );
}
