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
          <h1 className="section-title">Manage users, deposits, withdrawals, and balances.</h1>
        </div>
      </div>

      <section className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <article className="stat-card">
          <span className="muted-label">Total users</span>
          <p className="stat-value">{data.totals.totalUsers}</p>
        </article>
        <article className="stat-card">
          <span className="muted-label">Restricted users</span>
          <p className="stat-value">{data.totals.restrictedUsers}</p>
        </article>
        <article className="stat-card">
          <span className="muted-label">Pending deposits</span>
          <p className="stat-value">{data.totals.pendingDeposits}</p>
        </article>
        <article className="stat-card">
          <span className="muted-label">Pending withdrawals</span>
          <p className="stat-value">{data.totals.pendingWithdrawals}</p>
        </article>
        <article className="stat-card">
          <span className="muted-label">Open binary options</span>
          <p className="stat-value">{data.totals.openBinaryOptions}</p>
        </article>
      </section>

      <div className="stack">
        <AdminActions
          users={data.users}
          depositSubmissions={data.depositSubmissions}
          binaryOptions={data.binaryOptions}
          withdrawalRequests={data.withdrawalRequests}
        />
      </div>
    </main>
  );
}
