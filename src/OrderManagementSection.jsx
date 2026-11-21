import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const ORDER_STATUS_LABELS = {
  awaiting_payment: "Chờ thanh toán",
  pending: "Đã thanh toán · Chờ nhận",
  preparing: "Đang chuẩn bị",
  completed: "Hoàn tất",
};

function formatPrice(amount) {
  return `${Number(amount).toLocaleString("vi-VN")}đ`;
}

export default function OrderManagementSection({ id = "orders" }) {
  const { user } = useAuth();
  const [data, setData] = useState({ orders: [], revenue: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchApi("/orders", { signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function updateOrderStatus(order) {
    const status = {
      awaiting_payment: "pending",
      pending: "preparing",
      preparing: "completed",
    }[order.status];
    setError("");
    setUpdatingOrderId(order.id);
    try {
      await fetchApi(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setData((current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
        revenue:
          status === "completed" && current.revenue
            ? {
                total: current.revenue.total + order.total,
                completedOrders: current.revenue.completedOrders + 1,
                transactions: [
                  {
                    id: order.id,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    fulfillment: order.fulfillment,
                    tableNumber: order.tableNumber,
                    total: order.total,
                    createdAt: order.createdAt,
                  },
                  ...current.revenue.transactions,
                ],
              }
            : current.revenue,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <section className="order-management" id={id}>
      <div className="order-management-heading">
        <div>
          <span className="eyebrow">Phục vụ khách hàng</span>
          <h2>Đơn hàng</h2>
          <p>Tiếp nhận đơn mới và cập nhật trạng thái phục vụ.</p>
        </div>
        {user?.role === "admin" && data.revenue && (
          <div className="order-revenue-summary">
            <span>Doanh thu đơn hoàn tất</span>
            <strong>{formatPrice(data.revenue.total)}</strong>
            <small>{data.revenue.completedOrders} đơn đã hoàn tất</small>
          </div>
        )}
      </div>

      {error && (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      )}
      {user?.role === "admin" && data.revenue && (
        <div className="order-revenue-transactions">
          <h3>Giao dịch đã hoàn tất</h3>
          {data.revenue.transactions.length === 0 ? (
            <p className="resource-message">Chưa có giao dịch hoàn tất.</p>
          ) : (
            <div className="order-revenue-table-wrap">
              <table className="order-revenue-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Thời gian</th>
                    <th>Khách hàng</th>
                    <th>Hình thức</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenue.transactions.map((transaction) => (
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
        </div>
      )}
      {loading && <p className="resource-message">Đang tải đơn hàng…</p>}
      {!loading && !error && data.orders.length === 0 && (
        <p className="resource-message">Chưa có đơn hàng nào.</p>
      )}
      {!loading && data.orders.length > 0 && (
        <div className="order-management-list">
          {data.orders.map((order) => (
            <article className="staff-order-card" key={order.id}>
              <div className="staff-order-heading">
                <div>
                  <strong>Đơn #{order.id}</strong>
                  <span className={`staff-order-status is-${order.status}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <time dateTime={order.createdAt}>
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </time>
              </div>
              <div className="staff-order-customer">
                <strong>{order.customerName}</strong>
                {order.customerPhone ? (
                  <a href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}>
                    {order.customerPhone}
                  </a>
                ) : (
                  <span>Chưa có số điện thoại</span>
                )}
                <span>
                  {order.fulfillment === "dine_in"
                    ? `Tại quán · Bàn ${order.tableNumber}`
                    : "Mang đi"}
                </span>
              </div>
              <ul className="staff-order-items">
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="staff-order-footer">
                <strong>Tổng {formatPrice(order.total)}</strong>
                {order.status !== "completed" && (
                  <button
                    className="button"
                    type="button"
                    onClick={() => updateOrderStatus(order)}
                    disabled={updatingOrderId === order.id}
                  >
                    {updatingOrderId === order.id
                      ? "Đang cập nhật…"
                      : order.status === "awaiting_payment"
                        ? "Xác nhận thanh toán"
                        : order.status === "pending"
                          ? "Nhận đơn · Bắt đầu pha"
                          : "Đánh dấu hoàn tất"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
