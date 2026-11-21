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
  const [signOutError, setSignOutError] = useState("");
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authError, signOut } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

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
        <button
          className="menu-toggle"
          type="button"
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
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
          <NavLink to="/shifts">Đăng ký giờ làm</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">Quản trị</NavLink>}
          {user ? (
            <button
              className="nav-account"
              type="button"
              onClick={handleSignOut}
            >
              Đăng xuất · {user.name}
            </button>
          ) : (
            <NavLink className="nav-cta" to="/login">
              Đăng nhập
            </NavLink>
          )}
        </div>
      </nav>
      {(signOutError || authError) && (
        <p className="nav-error container" role="alert">
          {signOutError || authError}
        </p>
      )}
    </header>
  );
}
