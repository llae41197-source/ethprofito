import { getDashboardSnapshot } from "@/lib/queries";

export default async function DashboardPage() {
  const data = await getDashboardSnapshot();

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Trader dashboard</span>
          <h1 className="section-title">Portfolio, open positions, and funding status.</h1>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="grid-3">
          <article className="stat-card">
            <span className="muted-label">Registered users</span>
            <p className="stat-value">{data.users}</p>
            <p className="muted">Active customer records in the platform database.</p>
          </article>
          <article className="stat-card">
            <span className="muted-label">Ledger balance</span>
            <p className="stat-value">
              ${Number(data.balances._sum.amount ?? 0).toLocaleString()}
            </p>
            <p className="muted">Total internal balance across supported assets.</p>
          </article>
          <article className="stat-card">
            <span className="muted-label">Locked margin</span>
            <p className="stat-value">
              ${Number(data.balances._sum.lockedAmount ?? 0).toLocaleString()}
            </p>
            <p className="muted">Amount reserved for orders, holds, or review.</p>
          </article>
        </section>

        <aside className="panel">
          <p className="muted-label">Funding networks</p>
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
                  <td className="muted">{deposit.address.slice(0, 14)}...</td>
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
                <th>User</th>
                <th>Market</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Seed or connect the database to view live tickets.
                  </td>
                </tr>
              ) : (
                data.trades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.user.name ?? trade.user.email}</td>
                    <td>{trade.marketSymbol}</td>
                    <td>{trade.side}</td>
                    <td>{trade.quantity.toString()}</td>
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
    </main>
  );
}
