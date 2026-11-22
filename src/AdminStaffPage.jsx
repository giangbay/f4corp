import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "./api.js";

export default function AdminStaffPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const staff = await fetchApi("/admin/staff", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setSuccess(`Đã tạo tài khoản nhân viên ${staff.name}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-users admin-single-section">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Nhân sự</span>
          <h2>Tạo tài khoản nhân viên</h2>
          <p>Tài khoản mới có thể đăng ký ca, chấm công và xem đơn hàng.</p>
        </div>
        <Link to="/admin/accounts">Xem danh sách tài khoản <span aria-hidden="true">↗</span></Link>
      </header>
      <form className="admin-staff-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="staff-name">Tên nhân viên</label>
          <input
            id="staff-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            required
          />
          <span className="field-hint">Tối thiểu 10 ký tự.</span>
        </div>
        {error && <p className="form-message form-message-error" role="alert">{error}</p>}
        {success && <p className="form-message form-message-success" role="status">{success}</p>}
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang tạo…" : "Tạo tài khoản nhân viên"}
        </button>
      </form>
    </section>
  );
}
