import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "./api.js";

const SHORTCUTS = [
  {
    to: "/admin/menu",
    number: "01",
    title: "Thực đơn",
    description: "Thêm món mới, cập nhật thông tin và ảnh sản phẩm.",
  },
  {
    to: "/admin/orders",
    number: "02",
    title: "Đơn hàng",
    description: "Xác nhận thanh toán và cập nhật tiến độ phục vụ.",
  },
  {
    to: "/admin/revenue",
    number: "03",
    title: "Doanh thu",
    description: "Theo dõi các giao dịch đã hoàn tất.",
  },
  {
    to: "/admin/health",
    number: "04",
    title: "Sức khỏe website",
    description: "Kiểm tra tình trạng API và kết nối cơ sở dữ liệu.",
  },
  {
    to: "/admin/seo",
    number: "05",
    title: "Tình trạng SEO",
    description: "Theo dõi domain, sitemap, robots.txt và metadata.",
  },
  {
    to: "/admin/analytics",
    number: "06",
    title: "Lượt truy cập",
    description: "Xem lượt xem website theo ngày và trang phổ biến.",
  },
  {
    to: "/admin/payroll",
    number: "07",
    title: "Bảng công & lương",
    description: "Rà soát giờ làm, điều chỉnh công và duyệt lương.",
  },
  {
    to: "/admin/staff",
    number: "08",
    title: "Tạo tài khoản nhân viên",
    description: "Cấp tài khoản đăng nhập cho nhân sự mới.",
  },
  {
    to: "/admin/accounts",
    number: "09",
    title: "Tài khoản",
    description: "Xem danh sách tài khoản và vai trò hiện tại.",
  },
];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchApi("/admin/users", { signal: controller.signal })
      .then(setUsers)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const counts = [
    { label: "Tổng tài khoản", value: users.length },
    { label: "Khách hàng", value: users.filter((account) => account.role === "customer").length },
    { label: "Nhân viên", value: users.filter((account) => account.role === "staff").length },
    { label: "Quản trị viên", value: users.filter((account) => account.role === "admin").length },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-summary" aria-label="Tổng quan tài khoản">
        <div className="admin-dashboard-summary-copy">
          <span className="eyebrow">Bảng điều khiển</span>
          <h2>Công việc hôm nay</h2>
          <p>Đi thẳng đến từng khu vực để xử lý công việc, không cần cuộn qua một trang quản lý dài.</p>
        </div>
        <div className="admin-stats">
          {counts.map(({ label, value }) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{loading ? "—" : value}</strong>
            </article>
          ))}
        </div>
        {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      </section>

      <div className="admin-dashboard-section-heading">
        <div>
          <span className="eyebrow">Truy cập nhanh</span>
          <h2>Chức năng quản lý</h2>
        </div>
        <Link to="/shifts">Mở lịch đăng ký ca <span aria-hidden="true">↗</span></Link>
      </div>
      <nav className="admin-shortcuts" aria-label="Chức năng quản lý">
        {SHORTCUTS.map(({ to, number, title, description }) => (
          <Link className="admin-shortcut" key={to} to={to}>
            <span className="admin-shortcut-number">{number}</span>
            <span className="admin-shortcut-copy">
              <strong>{title}</strong>
              <span>{description}</span>
            </span>
            <span className="admin-shortcut-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
