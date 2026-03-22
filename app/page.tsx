import Link from "next/link";
import { adminActions, depositAddresses, platformStats } from "@/lib/data";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Multi-asset trading command center</span>
          <h1>Build ethprofito.com around custody, markets, and operator control.</h1>
          <p>
            This starter is designed as an admin-managed platform for crypto, stocks, and gold
            products with user portfolios, internal ledgering, deposit workflows, live chart
            embeds, and an admin back office. It should be reviewed for licensing, custody, KYC,
            AML, and securities compliance before any public launch.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="btn">
              Open trader dashboard
            </Link>
            <Link href="/admin" className="btn-secondary">
              Open admin controls
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="grid-3">
            {platformStats.map((item) => (
              <article key={item.label} className="stat-card">
                <span className="muted-label">{item.label}</span>
                <p className="stat-value">{item.value}</p>
                <p className="muted">{item.hint}</p>
              </article>
            ))}
          </div>
          <div className="panel" style={{ marginTop: "1rem" }}>
            <span className="kicker">Deposit wallets configured</span>
            <div className="grid-3" style={{ marginTop: "1rem" }}>
              {depositAddresses.map((item) => (
                <article key={item.symbol}>
                  <p className="muted-label">{item.symbol}</p>
                  <p>{item.chain}</p>
                  <div className="deposit-code">{item.address}</div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="kicker">Operator toolkit</span>
            <h2 className="section-title">Control the platform without losing the ledger.</h2>
          </div>
        </div>
        <div className="grid-2">
          <article className="panel">
            <p className="section-copy">
              The admin side includes account controls, balance adjustments, deposit approval
              queues, trade review, fee settings, and audit history. The schema is built so every
              sensitive action can be tracked back to an admin user.
            </p>
            <div className="note">
              Keep user asset handling limited to lawful custodial workflows with explicit terms,
              approvals, audit logs, and regulated operations.
            </div>
          </article>
          <article className="panel">
            <div className="grid-2">
              {adminActions.map((item) => (
                <div key={item} className="badge">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
