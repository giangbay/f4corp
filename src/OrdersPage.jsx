import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import OrderManagementSection from "./OrderManagementSection.jsx";

export default function OrdersPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <section className="admin-page container"><p>Đang xác minh phiên đăng nhập…</p></section>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/orders" }} />;
  if (!["staff", "admin"].includes(user.role)) return <Navigate to="/menu" replace />;

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">Khu vực phục vụ</span>
            <h1>Đơn hàng khách hàng</h1>
            <p>Tiếp nhận món khách đặt và cập nhật tiến độ phục vụ.</p>
          </div>
          {user.role === "admin" && (
            <Link className="button button-outline" to="/admin/orders">
              Quản trị đơn hàng
            </Link>
          )}
        </div>
        <OrderManagementSection />
      </div>
    </section>
  );
}
