import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchApi, useApiResource } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ResourceStatus from "../components/ResourceStatus.jsx";
import CommentsSection from "./CommentsSection.jsx";
import { getMenuCategoryLabel, MENU_CATEGORIES } from "../menuCategories.js";
import { getMenuItemPath } from "../menuSlug.js";

function MenuCard({ item, onAdd }) {
  return (
    <article className="menu-card">
      <Link
        className="menu-card-link"
        to={getMenuItemPath(item)}
        aria-label={`Xem chi tiết ${item.name}`}
      >
        <img src={item.image} alt={item.imageAlt} loading="lazy" />
        <div className="menu-card-body">
          <div className="menu-card-title">
            <div className="menu-card-name">
              <h2>{item.name}</h2>
              {Boolean(item.bestSeller) && (
                <span className="best-seller-badge">Bán chạy</span>
              )}
            </div>
            <span className="price">{item.price.toLocaleString("vi-VN")}đ</span>
          </div>
          <p>{item.description}</p>
          <span className="menu-card-more">Xem chi tiết món <span aria-hidden="true">→</span></span>
        </div>
      </Link>
      <button
        className="menu-card-add"
        type="button"
        onClick={() => onAdd(item)}
      >
        Thêm vào đơn
      </button>
    </article>
  );
}

export default function MenuPage() {
  const { data: items, loading, error } = useApiResource("/menu");
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handledAddToOrder = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillment, setFulfillment] = useState("takeaway");
  const [tableNumber, setTableNumber] = useState("");
  const [orderResult, setOrderResult] = useState(null);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const visibleItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);
  const cartItems = items
    .filter((item) => cart[item.id])
    .map((item) => ({ ...item, quantity: cart[item.id] }));
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0,
  );

  useEffect(() => {
    if (user?.name) setCustomerName((current) => current || user.name);
  }, [user]);

  function addToCart(item, openPanel = false) {
    setOrderResult(null);
    setOrderError("");
    setIsOrderPanelOpen(openPanel);
    setCart((current) => ({
      ...current,
      [item.id]: Math.min((current[item.id] ?? 0) + 1, 20),
    }));
  }

  useEffect(() => {
    const requestedItemId = Number(location.state?.addToOrder);
    if (!items.length || !Number.isSafeInteger(requestedItemId)) return;
    const requestKey = `${location.key}:${requestedItemId}`;
    if (handledAddToOrder.current === requestKey) return;
    handledAddToOrder.current = requestKey;
    const requestedItem = items.find((item) => Number(item.id) === requestedItemId);
    if (requestedItem) addToCart(requestedItem, true);
    navigate(location.pathname, { replace: true, state: null });
  }, [items, location.pathname, location.state, navigate]);

  function updateQuantity(itemId, quantity) {
    if (quantity < 1) setIsOrderPanelOpen(false);
    setCart((current) => {
      if (quantity < 1) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return { ...current, [itemId]: Math.min(quantity, 20) };
    });
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
      setCart({});
      setIsOrderPanelOpen(true);
    } catch (requestError) {
      setOrderError(requestError.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <>
      <section className="menu-section" id="thuc-don">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Từ quầy bar nhà Mộc 448</span>
              <h1>Món quen, vị thương.</h1>
            </div>
            <p>
              Từ cà phê đậm đà đến chút ngọt dịu cho buổi chiều — món nào cũng
              được làm mới mỗi ngày.
            </p>
          </div>
          <ResourceStatus loading={loading} error={error} />
          {!loading && !error && (
            <>
              <nav className="menu-category-nav" aria-label="Danh mục thực đơn">
                <button
                  type="button"
                  aria-pressed={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                >
                  Tất cả <span>{items.length}</span>
                </button>
                {MENU_CATEGORIES.map((category) => {
                  const count = items.filter(
                    (item) => item.category === category.value,
                  ).length;
                  return (
                    <button
                      type="button"
                      key={category.value}
                      aria-pressed={selectedCategory === category.value}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label} <span>{count}</span>
                    </button>
                  );
                })}
              </nav>
              {visibleItems.length > 0 ? (
                <div className="menu-grid">
                  {visibleItems.map((item) => (
                    <MenuCard item={item} key={item.id} onAdd={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="menu-category-empty">
                  <span className="eyebrow">
                    {getMenuCategoryLabel(selectedCategory)}
                  </span>
                  <p>Danh mục này đang được cập nhật. Mời bạn quay lại sau nhé.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
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
      <CommentsSection />
    </>
  );
}
