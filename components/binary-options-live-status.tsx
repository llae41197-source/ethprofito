"use client";

import { useEffect, useMemo, useState } from "react";

type OpenOption = {
  id: string;
  assetSymbol: string;
  marketSymbol: string;
  direction: string;
  durationSeconds: number;
  payoutPercent: number;
  stakeAmount: number;
  openingPrice: number;
  expiresAt: string;
};

type SettledOption = {
  id: string;
  assetSymbol: string;
  marketSymbol: string;
  direction: string;
  payoutPercent: number;
  stakeAmount: number;
  openingPrice: number;
  closingPrice: number | null;
  payoutAmount: number | null;
  status: string;
  settledAt: string | null;
};

type Props = {
  options: OpenOption[];
  recentSettled: SettledOption | null;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDirection(direction: string) {
  return direction === "CALL" ? "Buy More" : "Buy Down";
}

function formatAmount(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function BinaryOptionsLiveStatus({ options, recentSettled }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [reloaded, setReloaded] = useState(false);
  const [dismissedResultId, setDismissedResultId] = useState<string | null>(null);

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

  const activeOption = options[0] ?? null;
  const showResult = recentSettled && dismissedResultId !== recentSettled.id && options.length === 0;

  if (!activeOption && !showResult) return null;

  return (
    <>
      {activeOption ? (
        <div className="trade-modal-backdrop">
          <div className="trade-modal">
            <p className="muted-label">Active countdown</p>
            <div className="trade-modal-timer">{formatRemaining(new Date(activeOption.expiresAt).getTime() - now)}</div>
            <div className="trade-modal-grid">
              <div className="trade-modal-row">
                <span className="muted">Trading Pair</span>
                <strong>{activeOption.marketSymbol}/USDT</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Direction</span>
                <strong>{formatDirection(activeOption.direction)}</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Purchase Price</span>
                <strong>{activeOption.openingPrice.toFixed(4)}</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Trading lots</span>
                <strong>{activeOption.stakeAmount.toFixed(2)} USDT</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Profit on win</span>
                <strong>{(activeOption.stakeAmount * (activeOption.payoutPercent / 100)).toFixed(2)} USDT</strong>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showResult && recentSettled ? (
        <div className="trade-modal-backdrop">
          <div className="trade-modal">
            <div
              className={`trade-modal-result ${
                recentSettled.status === "LOST" ? "trade-modal-result-loss" : ""
              }`}
            >
              {formatAmount(
                recentSettled.status === "WON"
                  ? (recentSettled.payoutAmount ?? 0) - recentSettled.stakeAmount
                  : recentSettled.status === "LOST"
                    ? -recentSettled.stakeAmount
                    : 0
              )}
            </div>
            <div className="trade-modal-grid">
              <div className="trade-modal-row">
                <span className="muted">Trading Pair</span>
                <strong>{recentSettled.marketSymbol}/USDT</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Direction</span>
                <strong>{formatDirection(recentSettled.direction)}</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Purchase Price</span>
                <strong>{recentSettled.openingPrice.toFixed(4)}</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Settlement Price</span>
                <strong>{recentSettled.closingPrice?.toFixed(4) ?? "-"}</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Trading lots</span>
                <strong>{recentSettled.stakeAmount.toFixed(2)} USDT</strong>
              </div>
              <div className="trade-modal-row">
                <span className="muted">Actual profit and loss</span>
                <strong>
                  {recentSettled.status === "WON"
                    ? `${((recentSettled.payoutAmount ?? 0) - recentSettled.stakeAmount).toFixed(2)} USDT`
                    : recentSettled.status === "LOST"
                      ? `-${recentSettled.stakeAmount.toFixed(2)} USDT`
                      : "0.00 USDT"}
                </strong>
              </div>
            </div>
            <button className="btn trade-modal-button" onClick={() => setDismissedResultId(recentSettled.id)}>
              Continue trading
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
