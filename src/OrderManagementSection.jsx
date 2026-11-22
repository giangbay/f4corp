import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";

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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchApi("/orders", { signal: controller.signal })
      .then(({ orders: result }) => setOrders(result))
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
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status } : item,
        ),
      );
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
      </div>

      {error && (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      )}
      {loading && <p className="resource-message">Đang tải đơn hàng…</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="resource-message">Chưa có đơn hàng nào.</p>
      )}
      {!loading && orders.length > 0 && (
        <div className="order-management-list">
          {orders.map((order) => (
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
