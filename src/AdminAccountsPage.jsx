import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "./api.js";

const ROLE_LABELS = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

export default function AdminAccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

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

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return users.filter((account) =>
      (role === "all" || account.role === role) &&
      (!query ||
        account.name.toLocaleLowerCase("vi").includes(query) ||
        account.email.toLocaleLowerCase("vi").includes(query)),
    );
  }, [role, search, users]);

  return (
    <section className="admin-users admin-single-section">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Quản lý truy cập</span>
          <h2>Tài khoản</h2>
          <p>Tra cứu người dùng và vai trò được cấp trong hệ thống.</p>
        </div>
        <span className="admin-account-count">{users.length} tài khoản</span>
      </header>

      <div className="admin-account-filters">
        <label>
          <span>Tìm tài khoản</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tên hoặc email"
          />
        </label>
        <label>
          <span>Vai trò</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="staff">Nhân viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </label>
      </div>

      {loading && <p className="resource-message">Đang tải tài khoản…</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {!loading && !error && visibleUsers.length === 0 && (
        <p className="resource-message">Không tìm thấy tài khoản phù hợp.</p>
      )}
      {!loading && !error && visibleUsers.length > 0 && (
        <div className="user-table-wrap">
          <table className="user-table">
            <thead>
              <tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th></tr>
            </thead>
            <tbody>
              {visibleUsers.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.email}</td>
                  <td><span className={`admin-account-role is-${account.role}`}>{ROLE_LABELS[account.role]}</span></td>
                  <td>{new Date(account.createdAt).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
