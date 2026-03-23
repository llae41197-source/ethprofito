"use client";

import { useEffect, useMemo, useState } from "react";

type OpenOption = {
  id: string;
  assetSymbol: string;
  direction: string;
  durationSeconds: number;
  payoutPercent: number;
  stakeAmount: number;
  expiresAt: string;
};

type Props = {
  options: OpenOption[];
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function BinaryOptionsLiveStatus({ options }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [reloaded, setReloaded] = useState(false);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [options.length]);

  const nearestExpiry = useMemo(() => {
    if (options.length === 0) {
      return null;
    }

    return Math.min(...options.map((option) => new Date(option.expiresAt).getTime()));
  }, [options]);

  useEffect(() => {
    if (!nearestExpiry || reloaded) {
      return;
    }

    if (nearestExpiry <= now) {
      setReloaded(true);
      window.location.reload();
    }
  }, [nearestExpiry, now, reloaded]);

  if (options.length === 0) {
    return null;
  }

  return (
    <article className="panel">
      <p className="muted-label">Active countdown</p>
      <div className="stack">
        {options.map((option) => {
          const expiresAt = new Date(option.expiresAt).getTime();
          const remaining = expiresAt - now;
          const profit = option.stakeAmount * (option.payoutPercent / 100);

          return (
            <div key={option.id} className="admin-user-card">
              <strong>
                {option.assetSymbol} {option.direction}
              </strong>
              <p className="muted small" style={{ marginBottom: "0.35rem" }}>
                Capital: {option.stakeAmount.toFixed(2)} USDT
              </p>
              <p className="muted small" style={{ marginBottom: "0.35rem" }}>
                Profit if won: {profit.toFixed(2)} USDT
              </p>
              <p className="stat-value" style={{ margin: 0 }}>
                {formatRemaining(remaining)}
              </p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
