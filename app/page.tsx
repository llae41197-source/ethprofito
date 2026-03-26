import { TradingViewWidget } from "@/components/trading-view-widget";
import { getMarketCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const markets = await getMarketCards();
  const partners = [
    "BINANCE",
    "Bitstamp",
    "coinbase",
    "Gate.io",
    "Huobi",
    "kraken",
    "KUCOIN",
    "OKEX",
    "upbit",
    "WazirX",
    "Bitget",
    "crypto.com"
  ];

  return (
    <main className="shell section">
      <div className="market-grid">
        <section className="widget-shell">
          <TradingViewWidget symbol="BINANCE:BTCUSDT" />
        </section>
        <aside className="panel">
          <p className="muted-label">Featured instruments</p>
          <table className="table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Category</th>
                <th>Price</th>
                <th>Move</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => (
                <tr key={market.symbol}>
                  <td>
                    <strong>{market.name}</strong>
                    <div className="muted">{market.symbol}</div>
                  </td>
                  <td>{market.category}</td>
                  <td>{market.price}</td>
                  <td>
                    <span className={`badge ${market.change.startsWith("-") ? "danger" : ""}`}>
                      {market.change}
                    </span>
                  </td>
                  <td className="muted">{market.source ?? "Fallback"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="panel partners-panel">
          <p className="partners-title">Cooperation Platform</p>
          <p className="partners-copy">Trusted by global industry leaders</p>
          <div className="partners-grid">
            {partners.map((partner) => (
              <div key={partner} className="partner-chip">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
