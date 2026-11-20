import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchApi("/admin/users")
      .then(setUsers)
      .catch((requestError) => setError(requestError.message));
  }, [user]);

  if (loading) {
    return <section className="admin-page container"><p>Đang xác minh phiên đăng nhập…</p></section>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (user.role !== "admin") return <Navigate to="/chat" replace />;

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">Khu vực quản trị</span>
            <h1>Xin chào, {user.name}</h1>
            <p>Quản lý cộng đồng và xem danh sách tài khoản.</p>
          </div>
          <Link className="button" to="/chat">Kiểm duyệt bảng chat</Link>
        </div>
        <div className="admin-stats">
          <article>
            <span>Tổng tài khoản</span>
            <strong>{users.length}</strong>
          </article>
          <article>
            <span>Khách hàng</span>
            <strong>{users.filter((account) => account.role === "customer").length}</strong>
          </article>
          <article>
            <span>Quản trị viên</span>
            <strong>{users.filter((account) => account.role === "admin").length}</strong>
          </article>
        </div>
        <section className="admin-users">
          <h2>Tài khoản</h2>
          {error && <p className="form-message form-message-error" role="alert">{error}</p>}
          {!error && users.length === 0 && (
            <p className="resource-message">Đang tải tài khoản…</p>
          )}
          {users.length > 0 && (
            <div className="user-table-wrap">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => (
                    <tr key={account.id}>
                      <td>{account.name}</td>
                      <td>{account.email}</td>
                      <td>
                        {account.role === "admin"
                          ? "Quản trị viên"
                          : account.role === "staff"
                            ? "Nhân viên"
                            : "Khách hàng"}
                      </td>
                      <td>{new Date(account.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
