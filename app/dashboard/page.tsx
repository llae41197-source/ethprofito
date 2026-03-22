import { getUserDashboardSnapshot } from "@/lib/queries";
import { requireUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUserSession();
  const data = await getUserDashboardSnapshot(session.id);

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Trader dashboard</span>
          <h1 className="section-title">Portfolio, open positions, and funding status.</h1>
          <p className="section-copy">
            Signed in as {data.user.name ?? data.user.email}. This view only loads the authenticated
            account, not platform-wide admin data.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="grid-3">
          <article className="stat-card">
            <span className="muted-label">Assets held</span>
            <p className="stat-value">{data.balances.length}</p>
            <p className="muted">Wallet and portfolio rows assigned to your account.</p>
          </article>
          <article className="stat-card">
            <span className="muted-label">KYC status</span>
            <p className="stat-value">{data.user.kycStatus}</p>
            <p className="muted">Verification state attached to your customer profile.</p>
          </article>
          <article className="stat-card">
            <span className="muted-label">Recent orders</span>
            <p className="stat-value">{data.trades.length}</p>
            <p className="muted">Most recent trade tickets on your account.</p>
          </article>
        </section>

        <aside className="panel">
          <p className="muted-label">Your balances</p>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Available</th>
                <th>Locked</th>
              </tr>
            </thead>
            <tbody>
              {data.balances.map((balance) => (
                <tr key={balance.asset.symbol}>
                  <td>{balance.asset.symbol}</td>
                  <td>{Number(balance.amount).toFixed(4)}</td>
                  <td className="muted">{Number(balance.lockedAmount).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>

      <section className="section">
        <article className="table-shell">
          <div className="section-head">
            <div>
              <span className="muted-label">Recent platform trades</span>
              <h2 style={{ margin: "0.5rem 0 0" }}>Latest tickets</h2>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Entry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No trade tickets yet for this account.
                  </td>
                </tr>
              ) : (
                data.trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.marketSymbol}</td>
                    <td>{trade.side}</td>
                    <td>{trade.quantity.toString()}</td>
                    <td>{trade.entryPrice.toString()}</td>
                    <td>
                      <span className="badge">{trade.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </section>

      <section className="section">
        <article className="table-shell">
          <div className="section-head">
            <div>
              <span className="muted-label">Funding networks</span>
              <h2 style={{ margin: "0.5rem 0 0" }}>Available deposit addresses</h2>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Network</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {data.deposits.map((deposit) => (
                <tr key={deposit.address}>
                  <td>{deposit.assetCode}</td>
                  <td>{deposit.network}</td>
                  <td className="muted">{deposit.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
