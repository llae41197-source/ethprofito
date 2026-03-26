import { DepositUploadForm } from "@/components/deposit-upload-form";
import { CopyAddressButton } from "@/components/copy-address-button";
import { getDepositPageSnapshot } from "@/lib/queries";
import { requireUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const session = await requireUserSession();
  const data = await getDepositPageSnapshot(session.id);

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <span className="kicker">Funding rails</span>
          <h1 className="section-title">Deposit instructions for supported wallets.</h1>
        </div>
      </div>

      <div className="deposit-address-list">
        {data.depositAddresses.map((item) => (
          <article key={item.symbol} className="panel deposit-address-item">
            <div>
              <p className="muted-label">{item.chain}</p>
              <h3 style={{ marginTop: 0 }}>{item.symbol} Deposit</h3>
            </div>
            <div className="deposit-code-row">
              <div className="deposit-code">{item.address}</div>
              <CopyAddressButton address={item.address} />
            </div>
            <p className="muted">{item.note}</p>
          </article>
        ))}
      </div>

      <section className="section">
        <div className="admin-shell">
          <DepositUploadForm
            depositAddresses={data.depositAddresses.map((item) => ({
              symbol: item.symbol,
              chain: item.chain
            }))}
          />

          <article className="table-shell">
            <div className="section-head">
              <div>
                <span className="muted-label">Deposit review queue</span>
                <h2 style={{ margin: "0.5rem 0 0" }}>Your submitted screenshots</h2>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Amount</th>
                  <th>Tx Hash</th>
                  <th>Status</th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No deposit proofs submitted yet.
                    </td>
                  </tr>
                ) : (
                  data.submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td>{submission.asset.symbol}</td>
                      <td>{submission.amount.toString()}</td>
                      <td className="muted">{submission.txHash ?? "Not provided"}</td>
                      <td>
                        <span
                          className={`badge ${
                            submission.status === "REJECTED"
                              ? "danger"
                              : submission.status === "PENDING"
                                ? "warn"
                                : ""
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td>
                        {submission.screenshotData ? (
                          <a href={submission.screenshotData} target="_blank" rel="noreferrer">
                            View proof
                          </a>
                        ) : (
                          <span className="muted">No image</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        </div>
      </section>
    </main>
  );
}
