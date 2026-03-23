import { getWalletSnapshot } from "@/lib/queries";
import { requireUserSession } from "@/lib/session";
import { WithdrawalRequestForm } from "@/components/withdrawal-request-form";
import { SwapForm } from "@/components/swap-form";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await requireUserSession();
  const data = await getWalletSnapshot(session.id);

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Wallet center</span>
          <h1 className="section-title">Internal wallet balances, swaps, deposits, and withdrawals.</h1>
        </div>
      </div>

      <div className="grid-3">
        {data.balances.map((balance) => (
          <article key={balance.asset.symbol} className="stat-card">
            <span className="muted-label">{balance.asset.symbol} wallet</span>
            <p className="stat-value">{balance.amount.toFixed(4)}</p>
            <p className="muted">Locked: {balance.lockedAmount.toFixed(4)}</p>
          </article>
        ))}
      </div>

      <section className="section">
        <div className="admin-shell">
          <SwapForm balances={data.balances} />
          <WithdrawalRequestForm balances={data.balances} />
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <article className="table-shell">
            <div className="section-head">
              <div>
                <span className="muted-label">Deposit history</span>
                <h2 style={{ margin: "0.5rem 0 0" }}>Submitted deposits</h2>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {data.depositSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">No deposit history yet.</td>
                  </tr>
                ) : (
                  data.depositSubmissions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.asset.symbol}</td>
                      <td>{item.amount.toString()}</td>
                      <td><span className={`badge ${item.status === "REJECTED" ? "danger" : item.status === "PENDING" ? "warn" : ""}`}>{item.status}</span></td>
                      <td>{item.screenshotData ? <a href={item.screenshotData} target="_blank" rel="noreferrer">Open</a> : <span className="muted">No image</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>

          <article className="table-shell">
            <div className="section-head">
              <div>
                <span className="muted-label">Withdrawal history</span>
                <h2 style={{ margin: "0.5rem 0 0" }}>Withdrawal requests</h2>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawalRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">No withdrawal requests yet.</td>
                  </tr>
                ) : (
                  data.withdrawalRequests.map((item) => (
                    <tr key={item.id}>
                      <td>{item.asset.symbol}</td>
                      <td>{item.amount.toString()}</td>
                      <td className="muted">{item.destination}</td>
                      <td><span className={`badge ${item.status === "REJECTED" ? "danger" : item.status === "PENDING" ? "warn" : ""}`}>{item.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        </div>
      </section>

      <section className="section">
        <article className="table-shell">
          <div className="section-head">
            <div>
              <span className="muted-label">Swap history</span>
              <h2 style={{ margin: "0.5rem 0 0" }}>Completed internal conversions</h2>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.swapOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">No swaps yet.</td>
                </tr>
              ) : (
                data.swapOrders.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fromAmount.toString()} {item.fromAsset.symbol}</td>
                    <td>{item.toAmount.toString()} {item.toAsset.symbol}</td>
                    <td>{item.rate.toString()}</td>
                    <td><span className="badge">{item.status}</span></td>
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
