import { BinaryOptionsForm } from "@/components/binary-options-form";
import { getMarketCards, getUserDashboardSnapshot } from "@/lib/queries";
import { requireUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TradePage() {
  const session = await requireUserSession();
  const [dashboard, markets] = await Promise.all([
    getUserDashboardSnapshot(session.id),
    getMarketCards()
  ]);

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Binary options</span>
          <h1 className="section-title">Create short-duration crypto option tickets.</h1>
          <p className="section-copy">
            This module is admin-settled and database-tracked. Users can submit 30s, 60s, 90s,
            and longer tickets with configured payout percentages, while operators retain
            settlement control and audit history.
          </p>
        </div>
      </div>

      <div className="admin-shell">
        <BinaryOptionsForm
          balances={dashboard.balances}
          markets={markets
            .filter((market) => market.category === "Crypto")
            .map((market) => ({ symbol: market.symbol.replace("USD", ""), name: market.name }))}
        />

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
                <th>Stake</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.binaryOptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
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
                    <td>{option.stakeAmount.toString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          option.status === "LOST" ? "danger" : option.status === "OPEN" ? "warn" : ""
                        }`}
                      >
                        {option.status}
                      </span>
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
