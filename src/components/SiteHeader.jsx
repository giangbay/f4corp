import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authError, signOut } = useAuth();

  useEffect(() => {
    setIsOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isOpen && !isAccountOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setIsAccountOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, isAccountOpen]);

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
    } catch (requestError) {
      setSignOutError(requestError.message);
    }
  }

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="nav container" aria-label="Điều hướng chính">
        <Link
          className="brand"
          to="/"
          aria-label="Mộc Nhiên Coffee - Trang chủ"
        >
          <span className="brand-mark" aria-hidden="true">
            m
          </span>
          <span>Mộc Nhiên 448</span>
        </Link>
        <div
          className={`nav-links${isOpen ? " is-open" : ""}`}
          id="primary-navigation"
        >
          <NavLink to="/" end>
            Trang chủ
          </NavLink>
          <Link
            to="/story"
            aria-current={
              location.pathname === "/story" && !location.hash
                ? "page"
                : undefined
            }
          >
            Câu chuyện
          </Link>
          <NavLink to="/menu">Thực đơn</NavLink>
          <NavLink to="/blog">Blog</NavLink>
          <Link
            to="/space"
            aria-current={
              location.pathname === "/space"
                ? "location"
                : undefined
            }
          >
            Không gian
          </Link>
          {!user && (
            <NavLink className="nav-cta" to="/login">
              Đăng nhập
            </NavLink>
          )}
        </div>
        <div className="nav-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-label={isOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={isOpen}
            aria-controls="primary-navigation"
            onClick={() => {
              setIsOpen((open) => !open);
              setIsAccountOpen(false);
            }}
          >
            <span />
            <span />
            <span />
          </button>
          {user && (
            <button
              className="nav-account-toggle"
              type="button"
              aria-label={`Menu tài khoản của ${user.name}`}
              aria-expanded={isAccountOpen}
              aria-controls="account-navigation"
              onClick={() => {
                setIsAccountOpen((open) => !open);
                setIsOpen(false);
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c.7-3.5 3.2-5.3 7-5.3s6.3 1.8 7 5.3" />
              </svg>
            </button>
          )}
        </div>
        {user && (
          <div
            className={`account-menu-panel${isAccountOpen ? " is-open" : ""}`}
            id="account-navigation"
            aria-label="Menu tài khoản"
            hidden={!isAccountOpen}
          >
            <div className="account-menu-identity">
              <span className="account-menu-name">{user.name}</span>
              <span className="account-menu-role">
                {user.role === "admin"
                  ? "Quản trị viên"
                  : user.role === "staff"
                    ? "Nhân viên"
                    : "Khách hàng"}
              </span>
            </div>
            {user.role === "customer" && <NavLink to="/chat">Cộng đồng</NavLink>}
            {user.role === "staff" && (
              <>
                <NavLink to="/shifts">Đăng ký ca</NavLink>
                <NavLink to="/payroll">Bảng công & lương</NavLink>
                <NavLink to="/orders">Đơn hàng</NavLink>
              </>
            )}
            {user.role === "admin" && (
              <>
                <NavLink to="/admin" end>Bảng quản trị</NavLink>
                <NavLink to="/admin/orders">Đơn hàng</NavLink>
                <NavLink to="/admin/health">Sức khỏe website</NavLink>
                <NavLink to="/admin/seo">Tình trạng SEO</NavLink>
                <NavLink to="/admin/analytics">Lượt truy cập</NavLink>
                <NavLink to="/admin/payroll">Bảng công & lương</NavLink>
                <NavLink to="/shifts">Lịch đăng ký ca</NavLink>
              </>
            )}
            <button
              className="account-menu-sign-out"
              type="button"
              onClick={handleSignOut}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </nav>
      {(signOutError || authError) && (
        <p className="nav-error container" role="alert">
          {signOutError || authError}
        </p>
      )}
    </header>
  );
}
