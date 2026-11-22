import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillment, setFulfillment] = useState("takeaway");
  const [tableNumber, setTableNumber] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  useEffect(() => {
    if (user?.name) setCustomerName((current) => current || user.name);
  }, [user]);

  const addToOrder = useCallback((item, openPanel = false) => {
    setOrderResult(null);
    setOrderError("");
    setIsOrderPanelOpen(openPanel);
    setCartItems((current) => {
      const existingItem = current.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return current.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 20) }
            : cartItem,
        );
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }, []);

  function updateQuantity(itemId, quantity) {
    if (quantity < 1) setIsOrderPanelOpen(false);
    setCartItems((current) =>
      quantity < 1
        ? current.filter((item) => item.id !== itemId)
        : current.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.min(quantity, 20) }
              : item,
          ),
    );
  }

  async function submitOrder(event) {
    event.preventDefault();
    setIsSubmittingOrder(true);
    setOrderError("");
    try {
      const result = await fetchApi("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          fulfillment,
          tableNumber: fulfillment === "dine_in" ? tableNumber : "",
          items: cartItems.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      setOrderResult(result);
      setCartItems([]);
      setIsOrderPanelOpen(true);
    } catch (requestError) {
      setOrderError(requestError.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <OrderContext.Provider
      value={{
        addToOrder,
        isOrderPanelOpen,
        setIsOrderPanelOpen,
      }}
    >
      {children}
      {(cartCount > 0 || orderResult) && (
        <>
          {isOrderPanelOpen && (
            <aside className="customer-order" aria-label="Đơn hàng của bạn">
              <div className="customer-order-heading">
                <div>
                  <span className="eyebrow">
                    {orderResult ? "Đơn hàng đã gửi" : "Đơn của bạn"}
                  </span>
                  <h2>{orderResult ? `Đơn #${orderResult.id}` : "Thực đơn đã chọn"}</h2>
                </div>
                <button
                  className="customer-order-close"
                  type="button"
                  aria-label="Đóng thẻ đơn hàng"
                  onClick={() => setIsOrderPanelOpen(false)}
                >
                  ×
                </button>
              </div>
              {orderResult ? (
                <div className="customer-order-thank-you" role="status">
                  <span className="staff-order-status is-awaiting_payment">
                    Chờ thanh toán
                  </span>
                  <h3>Cảm ơn bạn đã đặt món!</h3>
                  <p>Tổng đơn · {Number(orderResult.total).toLocaleString("vi-VN")}đ</p>
                  <div
                    className="order-qr-placeholder"
                    role="img"
                    aria-label="Khu vực hiển thị mã QR chuyển khoản của quán"
                  >
                    Mã QR thanh toán
                  </div>
                  <p>Hẹn gặp lại bạn tại Mộc Nhiên Coffee.</p>
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={() => {
                      setOrderResult(null);
                      setIsOrderPanelOpen(false);
                    }}
                  >
                    Tiếp tục xem thực đơn
                  </button>
                </div>
              ) : (
                <>
                  <div className="customer-order-items">
                    {cartItems.map((item) => (
                      <div className="customer-order-item" key={item.id}>
                        <img src={item.image} alt="" loading="lazy" />
                        <div>
                          <strong>{item.name}</strong>
                          <span>{Number(item.price).toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="customer-order-quantity">
                          <button
                            type="button"
                            aria-label={`Giảm số lượng ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Tăng số lượng ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 20}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="customer-order-total">
                      <span>Tạm tính</span>
                      <strong>{cartTotal.toLocaleString("vi-VN")}đ</strong>
                    </div>
                  </div>
                  <form className="customer-order-form" onSubmit={submitOrder}>
                    <label htmlFor="order-customer-name">Tên người nhận</label>
                    <input
                      id="order-customer-name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      minLength={2}
                      maxLength={120}
                      autoComplete="name"
                      required
                    />
                    <label htmlFor="order-customer-phone">Số điện thoại</label>
                    <input
                      id="order-customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      maxLength={40}
                      autoComplete="tel"
                      required
                    />
                    <label htmlFor="order-fulfillment">Nhận món</label>
                    <select
                      id="order-fulfillment"
                      value={fulfillment}
                      onChange={(event) => setFulfillment(event.target.value)}
                    >
                      <option value="takeaway">Mang đi</option>
                      <option value="dine_in">Dùng tại quán</option>
                    </select>
                    {fulfillment === "dine_in" && (
                      <>
                        <label htmlFor="order-table-number">Số bàn</label>
                        <input
                          id="order-table-number"
                          value={tableNumber}
                          onChange={(event) => setTableNumber(event.target.value)}
                          maxLength={20}
                          required
                        />
                      </>
                    )}
                    {orderError && (
                      <p className="form-message form-message-error" role="alert">
                        {orderError}
                      </p>
                    )}
                    <button
                      className="button customer-order-submit"
                      type="submit"
                      disabled={isSubmittingOrder}
                    >
                      {isSubmittingOrder ? "Đang gửi đơn…" : "Gửi đơn cho quán"}
                    </button>
                    <p className="customer-order-note">
                      Bạn có thể đặt món không cần đăng nhập. Đơn sẽ được nhân viên tiếp nhận.
                    </p>
                  </form>
                </>
              )}
            </aside>
          )}
          <button
            className="customer-order-toggle"
            type="button"
            aria-expanded={isOrderPanelOpen}
            onClick={() => setIsOrderPanelOpen((open) => !open)}
          >
            {orderResult
              ? `Đơn #${orderResult.id} · Chờ thanh toán`
              : `Đơn hàng · ${cartCount} món · ${cartTotal.toLocaleString("vi-VN")}đ`}
          </button>
        </>
      )}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
