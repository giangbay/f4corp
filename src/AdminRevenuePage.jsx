import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";

function formatPrice(amount) {
  return `${Number(amount).toLocaleString("vi-VN")}đ`;
}

export default function AdminRevenuePage() {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchApi("/orders", { signal: controller.signal })
      .then(({ revenue: report }) => setRevenue(report))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="admin-revenue-page">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Báo cáo kinh doanh</span>
          <h2>Doanh thu</h2>
          <p>Chỉ tính các đơn hàng đã hoàn tất.</p>
        </div>
      </header>
      {loading && <p className="resource-message">Đang tải doanh thu…</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {!loading && !error && revenue && (
        <>
          <div className="order-revenue-summary admin-revenue-total">
            <span>Doanh thu đơn hoàn tất</span>
            <strong>{formatPrice(revenue.total)}</strong>
            <small>{revenue.completedOrders} đơn đã hoàn tất</small>
          </div>
          <section className="order-revenue-transactions">
            <h3>Giao dịch đã hoàn tất</h3>
            {revenue.transactions.length === 0 ? (
              <p className="resource-message">Chưa có giao dịch hoàn tất.</p>
            ) : (
              <div className="order-revenue-table-wrap">
                <table className="order-revenue-table">
                  <thead>
                    <tr><th>Mã đơn</th><th>Thời gian</th><th>Khách hàng</th><th>Hình thức</th><th>Doanh thu</th></tr>
                  </thead>
                  <tbody>
                    {revenue.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>#{transaction.id}</td>
                        <td>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</td>
                        <td>
                          <strong>{transaction.customerName}</strong>
                          {transaction.customerPhone && <small>{transaction.customerPhone}</small>}
                        </td>
                        <td>
                          {transaction.fulfillment === "dine_in"
                            ? `Tại quán · Bàn ${transaction.tableNumber}`
                            : "Mang đi"}
                        </td>
                        <td>{formatPrice(transaction.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
