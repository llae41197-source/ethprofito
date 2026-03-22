import { AdminActions } from "@/components/admin-actions";
import { getAdminSnapshot } from "@/lib/queries";
import { requireAdminSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  const data = await getAdminSnapshot();

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Admin control room</span>
          <h1 className="section-title">Manage balances, approvals, users, and audit history.</h1>
        </div>
      </div>

      <div className="admin-shell">
        <section className="stack">
          <article className="panel">
            <div className="grid-2">
              <div>
                <p className="muted-label">Total users</p>
                <p className="stat-value">{data.totals.totalUsers}</p>
              </div>
              <div>
                <p className="muted-label">Restricted users</p>
                <p className="stat-value">{data.totals.restrictedUsers}</p>
              </div>
            </div>
          </article>

          <article className="panel">
          <p className="muted-label">Permissions model</p>
          <p className="section-copy">
            Admin actions now run through authenticated server routes. Balance adjustments create
            both ledger entries and audit logs, while user restrictions and KYC changes are written
            back to the database instead of staying as sample-only UI rows.
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
                      No audit rows yet. Run the seed script or submit admin actions to populate
                      activity.
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
        </section>

        <AdminActions users={data.users} />
      </div>
    </main>
  );
}
