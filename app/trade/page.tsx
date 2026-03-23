import { BinaryOptionsForm } from "@/components/binary-options-form";
import { getMarketCards, getUserDashboardSnapshot } from "@/lib/queries";
import { requireUserSession } from "@/lib/session";
import { settleExpiredBinaryOptionsForUser } from "@/lib/binary-options";
import { BinaryOptionsLiveStatus } from "@/components/binary-options-live-status";

export const dynamic = "force-dynamic";

export default async function TradePage() {
  const session = await requireUserSession();
  await settleExpiredBinaryOptionsForUser(session.id);
  const [dashboard, markets] = await Promise.all([
    getUserDashboardSnapshot(session.id),
    getMarketCards()
  ]);

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Binary options</span>
          <h1 className="section-title">Create short-duration demo crypto option tickets.</h1>
          <p className="section-copy">
            Duration now controls the payout and minimum capital automatically. Each trade uses
            USDT as the stake wallet, runs its countdown, and settles back into the user balance
            after expiry in practice mode.
          </p>
        </div>
      </div>

      <div className="admin-shell">
        <div className="stack">
          <BinaryOptionsForm
            balances={dashboard.balances}
            markets={markets
              .filter((market) => market.category === "Crypto")
              .map((market) => ({ symbol: market.symbol.replace("USD", ""), name: market.name }))}
          />
          <BinaryOptionsLiveStatus
            options={dashboard.binaryOptions
              .filter((option) => option.status === "OPEN")
              .map((option) => ({
                id: option.id,
                assetSymbol: option.asset.symbol,
                direction: option.direction,
                durationSeconds: option.durationSeconds,
                payoutPercent: option.payoutPercent,
                stakeAmount: Number(option.stakeAmount),
                expiresAt: new Date(option.expiresAt).toISOString()
              }))}
          />
        </div>

        <article className="table-shell">
          <div className="section-head">
            <div>
              <span className="muted-label">Open and settled options</span>
              <h2 style={{ margin: "0.5rem 0 0" }}>Your binary option history</h2>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Direction</th>
                <th>Duration</th>
                <th>Payout</th>
                <th>Capital</th>
                <th>Profit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.binaryOptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No binary option tickets yet.
                  </td>
                </tr>
              ) : (
                dashboard.binaryOptions.map((option) => (
                  <tr key={option.id}>
                    <td>{option.asset.symbol}</td>
                    <td>{option.direction}</td>
                    <td>{option.durationSeconds}s</td>
                    <td>{option.payoutPercent}%</td>
                    <td>{Number(option.stakeAmount).toFixed(2)} USDT</td>
                    <td>
                      {option.status === "WON"
                        ? `${(Number(option.payoutAmount ?? 0) - Number(option.stakeAmount)).toFixed(2)} USDT`
                        : option.status === "CANCELLED"
                          ? "0.00 USDT"
                          : option.status === "OPEN"
                            ? `${(Number(option.stakeAmount) * (option.payoutPercent / 100)).toFixed(2)} USDT`
                            : `-${Number(option.stakeAmount).toFixed(2)} USDT`}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          option.status === "LOST" ? "danger" : option.status === "OPEN" ? "warn" : ""
                        }`}
                      >
                        {option.status}
                      </span>
                      {option.status !== "OPEN" ? (
                        <div className="muted small" style={{ marginTop: "0.35rem" }}>
                          {option.status === "WON"
                            ? `Capital ${Number(option.stakeAmount).toFixed(2)} + profit ${(Number(option.payoutAmount ?? 0) - Number(option.stakeAmount)).toFixed(2)} credited`
                            : option.status === "CANCELLED"
                              ? `Capital ${Number(option.stakeAmount).toFixed(2)} refunded`
                              : `Capital ${Number(option.stakeAmount).toFixed(2)} lost`}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </div>
    </main>
  );
}
