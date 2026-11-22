import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const ADMIN_LINKS = [
  { to: "/admin", label: "Tổng quan", end: true },
  { to: "/admin/menu", label: "Thực đơn" },
  { to: "/admin/orders", label: "Đơn hàng" },
  { to: "/admin/revenue", label: "Doanh thu" },
  { to: "/admin/health", label: "Sức khỏe website" },
  { to: "/admin/seo", label: "Tình trạng SEO" },
  { to: "/admin/analytics", label: "Lượt truy cập" },
  { to: "/admin/payroll", label: "Bảng công & lương" },
  { to: "/admin/staff", label: "Tạo nhân viên" },
  { to: "/admin/accounts", label: "Tài khoản" },
  { to: "/shifts", label: "Lịch đăng ký ca" },
];

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <section className="admin-page container"><p>Đang xác minh phiên đăng nhập…</p></section>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user.role !== "admin") {
    return <Navigate to={user.role === "staff" ? "/shifts" : "/chat"} replace />;
  }

  return (
    <section className="admin-page">
      <div className="container">
        <header className="admin-shell-heading">
          <div>
            <span className="eyebrow">Không gian làm việc</span>
            <h1>Quản trị Mộc Nhiên</h1>
            <p>Xin chào, {user.name}. Chọn một mục để quản lý riêng.</p>
          </div>
          <Link className="button button-outline" to="/">Xem website</Link>
        </header>
        <nav className="admin-nav" aria-label="Danh sách chức năng quản trị">
          {ADMIN_LINKS.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </section>
  );
}
