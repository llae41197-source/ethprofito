import { depositAddresses, platformStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="section" style={{ paddingTop: "3rem" }}>
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
    </main>
  );
}
