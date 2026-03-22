import { depositAddresses } from "@/lib/data";

export default function DepositPage() {
  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Funding rails</span>
          <h1 className="section-title">Deposit instructions for supported wallets.</h1>
        </div>
      </div>

      <div className="grid-3">
        {depositAddresses.map((item) => (
          <article key={item.symbol} className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p className="muted-label">{item.chain}</p>
                <h3 style={{ marginTop: 0 }}>{item.symbol} Deposit</h3>
              </div>
              <span className="badge">{item.confirmations}</span>
            </div>
            <div className="deposit-code">{item.address}</div>
            <p className="muted">{item.note}</p>
          </article>
        ))}
      </div>

      <section className="section">
        <article className="panel">
          <p className="muted-label">Operational notes</p>
          <p className="section-copy">
            This page displays configured deposit addresses only. Production crediting should be
            done through a deposit monitoring worker, network validation, transaction risk checks,
            and manual approval logic before balances are released for trading or withdrawal.
          </p>
        </article>
      </section>
    </main>
  );
}
