import { getMarketCards } from "@/lib/queries";
import { TradingViewWidget } from "@/components/trading-view-widget";

export default async function MarketsPage() {
  const markets = await getMarketCards();

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Live market surfaces</span>
          <h1 className="section-title">Track crypto, stocks, and gold from one screen.</h1>
        </div>
      </div>

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
                    <span
                      className={`badge ${market.change.startsWith("-") ? "danger" : ""}`}
                    >
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

      <section className="section">
        <div className="grid-2">
          <div className="widget-shell">
            <TradingViewWidget symbol="OANDA:XAUUSD" height={360} />
          </div>
          <div className="widget-shell">
            <TradingViewWidget symbol="NASDAQ:AAPL" height={360} />
          </div>
        </div>
      </section>
    </main>
  );
}
