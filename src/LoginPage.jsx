import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const { user, loading, signIn, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/chat"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const signedInUser = mode === "register"
        ? await register({ name, email, password })
        : await signIn({ email, password });
      const destination = location.state?.from;
      navigate(
        destination ?? (signedInUser.role === "admin" ? "/admin" : "/chat"),
        { replace: true },
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">Mộc Nhiên chào bạn</span>
        <h1>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản khách hàng"}</h1>
        <p className="auth-description">
          {mode === "login"
            ? "Đăng nhập để trò chuyện và chia sẻ cùng cộng đồng."
            : "Tạo tài khoản để đăng bài và bình luận trong cộng đồng."}
        </p>
        <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "is-selected" : ""}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={mode === "register" ? "is-selected" : ""}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Đăng ký khách hàng
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label htmlFor="auth-name">Tên hiển thị</label>
              <input
                id="auth-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                maxLength={60}
                autoComplete="name"
                required
              />
            </>
          )}
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            autoComplete="email"
            required
          />
          <label htmlFor="auth-password">Mật khẩu</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={mode === "register" ? 10 : undefined}
            maxLength={128}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
          />
          {mode === "register" && (
            <span className="field-hint">Tối thiểu 10 ký tự.</span>
          )}
          {error && <p className="form-message form-message-error" role="alert">{error}</p>}
          <button className="button" type="submit" disabled={isSubmitting || loading}>
            {isSubmitting
              ? "Đang xử lý…"
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </button>
        </form>
        <Link className="text-link auth-back-link" to="/">
          ← Trở về trang chủ
        </Link>
      </div>
    </section>
  );
}
