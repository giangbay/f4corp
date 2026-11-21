import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AdminMenuSection from "./AdminMenuSection.jsx";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchApi("/admin/users")
      .then(setUsers)
      .catch((requestError) => setError(requestError.message));
  }, [user]);

  async function handleCreateStaff(event) {
    event.preventDefault();
    setStaffError("");
    setStaffSuccess("");
    setIsCreatingStaff(true);

    try {
      const staff = await fetchApi("/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
        }),
      });
      setUsers((existing) => [staff, ...existing]);
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffSuccess(`Đã tạo tài khoản nhân viên ${staff.name}.`);
    } catch (requestError) {
      setStaffError(requestError.message);
    } finally {
      setIsCreatingStaff(false);
    }
  }

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
        <div className="admin-heading">
          <div>
            <span className="eyebrow">Khu vực quản trị</span>
            <h1>Xin chào, {user.name}</h1>
            <p>Quản lý thực đơn, tài khoản và nhân sự của Mộc Nhiên.</p>
          </div>
          <Link className="button" to="/shifts">Xem lịch giờ làm</Link>
        </div>
        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          <a href="#admin-overview">Tổng quan</a>
          <a href="#admin-menu">Sản phẩm menu</a>
          <a href="#admin-staff">Nhân sự</a>
          <a href="#admin-accounts">Tài khoản</a>
        </nav>
        <div className="admin-stats" id="admin-overview">
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
          <article>
            <span>Nhân viên</span>
            <strong>{users.filter((account) => account.role === "staff").length}</strong>
          </article>
        </div>
        <AdminMenuSection />
        <section className="admin-users" id="admin-staff">
          <h2>Tạo tài khoản nhân viên</h2>
          <form className="admin-staff-form" onSubmit={handleCreateStaff}>
            <div>
              <label htmlFor="staff-name">Tên nhân viên</label>
              <input
                id="staff-name"
                name="name"
                value={staffName}
                onChange={(event) => setStaffName(event.target.value)}
                minLength={2}
                maxLength={60}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="staff-email">Email đăng nhập</label>
              <input
                id="staff-email"
                name="email"
                type="email"
                value={staffEmail}
                onChange={(event) => setStaffEmail(event.target.value)}
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="staff-password">Mật khẩu ban đầu</label>
              <input
                id="staff-password"
                name="password"
                type="password"
                value={staffPassword}
                onChange={(event) => setStaffPassword(event.target.value)}
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                required
              />
              <span className="field-hint">Tối thiểu 10 ký tự.</span>
            </div>
            {staffError && (
              <p className="form-message form-message-error" role="alert">
                {staffError}
              </p>
            )}
            {staffSuccess && (
              <p className="form-message form-message-success" role="status">
                {staffSuccess}
              </p>
            )}
            <button className="button" type="submit" disabled={isCreatingStaff}>
              {isCreatingStaff ? "Đang tạo…" : "Tạo tài khoản"}
            </button>
          </form>
        </section>
        <section className="admin-users" id="admin-accounts">
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
