import { getDashboardSnapshot } from "@/lib/queries";
import { sampleAccounts } from "@/lib/data";

export default async function AdminPage() {
  const data = await getDashboardSnapshot();

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Admin control room</span>
          <h1 className="section-title">Manage balances, approvals, users, and audit history.</h1>
        </div>
      </div>

      <div className="grid-2">
        <article className="panel">
          <p className="muted-label">Permissions model</p>
          <p className="section-copy">
            The schema supports admin users, role flags, account restrictions, balance
            adjustments, trade review, and full audit logging. Every manual balance change should
            create an audit log and ledger entry before it reaches a customer-facing portfolio.
          </p>
          <div className="note">
            Never operate this as a real brokerage or exchange without legal review, custody
            controls, sanctions screening, KYC, AML, withdrawal risk checks, and the required
            licenses in your jurisdiction.
          </div>
        </article>

        <article className="panel">
          <p className="muted-label">Latest audit events</p>
          <table className="table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {data.auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No audit rows yet. Run the seed script to populate admin activity.
                  </td>
                </tr>
              ) : (
                data.auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.admin?.name ?? log.admin?.email ?? "System"}</td>
                    <td>{log.action}</td>
                    <td>{log.user?.email ?? log.targetType}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </div>

      <section className="section">
        <article className="table-shell">
          <div className="section-head">
            <div>
              <span className="muted-label">User account supervision</span>
              <h2 style={{ margin: "0.5rem 0 0" }}>Sample managed accounts</h2>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Tier</th>
                <th>Equity</th>
                <th>Exposure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleAccounts.map((account) => (
                <tr key={account.email}>
                  <td>
                    <strong>{account.name}</strong>
                    <div className="muted">{account.email}</div>
                  </td>
                  <td>{account.tier}</td>
                  <td>{account.equity}</td>
                  <td>{account.exposure}</td>
                  <td>
                    <span
                      className={`badge ${
                        account.status === "Restricted"
                          ? "danger"
                          : account.status === "Pending KYC"
                            ? "warn"
                            : ""
                      }`}
                    >
                      {account.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
