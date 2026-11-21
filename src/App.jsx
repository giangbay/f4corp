import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { fetchApi, useApiResource } from "./api.js";
import { useAuth } from "./AuthContext.jsx";
import AdminPage from "./AdminPage.jsx";
import ChatPage from "./ChatPage.jsx";
import LoginPage from "./LoginPage.jsx";

function ScrollProgress() {
  useEffect(() => {
    const updateProgress = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(progress),
      );
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}

function ScrollToLocation() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    });
  }, [pathname, hash]);

  return null;
}

function SiteHeader() {
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
          <NavLink to="/story">Câu chuyện</NavLink>
          <NavLink to="/menu">Thực đơn</NavLink>
          <NavLink to="/story#khong-gian">Không gian</NavLink>
          <NavLink to="/chat">Bảng chat</NavLink>
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

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <Link className="footer-brand" to="/">
          Mộc Nhiên Coffee
        </Link>
        <span className="footer-note">Một tách cà phê, một ngày dịu dàng.</span>
        <div className="footer-links">
          <Link to="/story">Câu chuyện</Link>
          <Link to="/menu">Thực đơn</Link>
          <Link to="/visit">Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}

function ResourceStatus({ loading, error }) {
  if (loading) return <p className="resource-message">Đang tải dữ liệu…</p>;
  if (error)
    return (
      <p className="form-message form-message-error" role="alert">
        {error}
      </p>
    );
  return null;
}

function HomePage() {
  return (
    <section className="hero container" id="trang-chu">
      <div className="hero-copy">
        <span className="eyebrow">
          Một góc nhỏ giữa phố Hà Nội. Hôm nay bạn thế nào?
        </span>
        <h1>
          Chạm một 448 chút <em>bình yên.</em>
        </h1>
        <p>
          Có những ngày, điều bạn cần chỉ là một tách cà phê thơm và một nơi
          thật dễ chịu. Mộc Nhiên luôn dành sẵn cho bạn một góc như thế.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/menu">
            Khám phá thực đơn <span aria-hidden="true">→</span>
          </Link>
          <Link className="button button-outline" to="/story">
            Chuyện của Mộc
          </Link>
        </div>
        <div className="hero-note">
          <span className="note-stars" aria-label="5 trên 5 sao">
            ★★★★★
          </span>
          <span>Cà phê tử tế, mỗi ngày từ 7:00 sáng</span>
        </div>
      </div>
      <div className="hero-visual">
        <img
          className="hero-image"
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85"
          alt="Tách cà phê được pha trong không gian ấm áp"
        />
        <div className="image-caption">
          <span className="caption-icon" aria-hidden="true">
            ☕
          </span>
          <div>
            <strong>Pha bằng cả sự chăm chút</strong>
            <span>Hạt ngon · Rang vừa · Vị lành</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryPage() {
  return (
    <section className="intro" id="cau-chuyen">
      <div className="intro-grid container">
        <div className="intro-copy">
          <span className="eyebrow">Chuyện của Mộc</span>
          <h1>
            Cà phê ngon.
            <br />
            Khoảnh khắc lành.
          </h1>
          <p>
            Mộc Nhiên bắt đầu từ tình yêu với những điều giản dị: hạt cà phê
            được chọn kỹ, góc bàn ngập nắng và một lời chào thân quen. Chúng
            mình tin một ngày dễ chịu có thể bắt đầu từ những điều nhỏ như vậy.
          </p>
          <p>
            Mỗi tách đều được pha chậm rãi, từ nông trại Việt Nam đến chiếc bàn
            nhỏ của bạn.
          </p>
          <Link className="text-link" to="/visit">
            Tìm đường đến Mộc <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="intro-photo-wrap" id="khong-gian">
          <img
            className="intro-photo"
            src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1100&q=85"
            alt="Không gian quán cà phê thoáng đãng với bàn gỗ"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

function MenuCard({ item }) {
  return (
    <article className="menu-card">
      <img src={item.image} alt={item.imageAlt} loading="lazy" />
      <div className="menu-card-body">
        <div className="menu-card-title">
          <h2>{item.name}</h2>
          <span className="price">{item.price.toLocaleString("vi-VN")}đ</span>
        </div>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

function CommentsSection() {
  const { user } = useAuth();
  const { data: comments, loading, error } = useApiResource("/comments");
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedComments, setSavedComments] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const comment = await fetchApi("/comments", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSavedComments((existing) => [comment, ...existing]);
      setMessage("");
    } catch (submitFailure) {
      setSubmitError(submitFailure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleComments = [...savedComments, ...comments];

  return (
    <section className="comments-section">
      <div className="comments-layout container">
        <div>
          <span className="eyebrow">Lời thương gửi Mộc</span>
          <h2>Góc chia sẻ</h2>
          <p className="comments-intro">
            Để lại vài dòng cảm nhận sau lần ghé thăm của bạn nhé.
          </p>
          {user ? (
            <form className="comment-form" onSubmit={handleSubmit}>
              <label htmlFor="comment-message">
                Bình luận với tên {user.name}
              </label>
              <textarea
                id="comment-message"
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                minLength={2}
                maxLength={600}
                rows={4}
                required
              />
              {submitError && (
                <p className="form-message form-message-error" role="alert">
                  {submitError}
                </p>
              )}
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi…" : "Đăng bình luận"}
              </button>
            </form>
          ) : (
            <p className="comments-intro">
              <Link to="/login">Đăng nhập</Link> để gửi bình luận.
            </p>
          )}
        </div>
        <div className="comments-list" aria-live="polite">
          <ResourceStatus loading={loading} error={error} />
          {!loading && !error && visibleComments.length === 0 && (
            <p className="resource-message">Chưa có bình luận nào.</p>
          )}
          {visibleComments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <strong>{comment.name}</strong>
              <p>{comment.message}</p>
              <time dateTime={comment.createdAt}>
                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
              </time>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuPage() {
  const { data: items, loading, error } = useApiResource("/menu");

  return (
    <>
      <section className="menu-section" id="thuc-don">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Từ quầy bar nhà Mộc 448</span>
              <h1>Món quen, vị thương.</h1>
            </div>
            <p>
              Từ cà phê đậm đà đến chút ngọt dịu cho buổi chiều — món nào cũng
              được làm mới mỗi ngày.
            </p>
          </div>
          <ResourceStatus loading={loading} error={error} />
          {!loading && !error && (
            <div className="menu-grid">
              {items.map((item) => (
                <MenuCard item={item} key={item.id} />
              ))}
            </div>
          )}
        </div>
      </section>
      <CommentsSection />
    </>
  );
}

function VisitPage() {
  const { data: locations, loading, error } = useApiResource("/locations");

  return (
    <section className="visit" id="ghe-choi">
      <div className="visit-grid container">
        <div className="visit-copy">
          <span className="eyebrow">Mộc ở đây nè</span>
          <h1>Ghé chơi một chút, ở lại thật lâu.</h1>
          <p>
            Cửa tiệm nhỏ luôn mở cửa đón bạn. Rủ một người thương, mang theo
            cuốn sách hay — phần còn lại để Mộc lo.
          </p>
          <a
            className="button"
            href="https://maps.google.com/?q=Quan+cafe+gan+toi"
            target="_blank"
            rel="noreferrer"
          >
            Xem đường đến quán <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ResourceStatus loading={loading} error={error} />
        {!loading &&
          !error &&
          locations.map((location) => (
            <div className="visit-details" key={location.id}>
              <div className="detail">
                <span className="detail-icon" aria-hidden="true">
                  ⌖
                </span>
                <div>
                  <strong>Địa chỉ</strong>
                  <span>
                    {location.address}
                    <br />
                    {location.city}
                  </span>
                </div>
              </div>
              <div className="detail">
                <span className="detail-icon" aria-hidden="true">
                  ◷
                </span>
                <div>
                  <strong>Giờ mở cửa</strong>
                  <span>{location.openingHours}</span>
                </div>
              </div>
              <div className="detail">
                <span className="detail-icon" aria-hidden="true">
                  ✆
                </span>
                <div>
                  <strong>Gọi cho Mộc</strong>
                  <a href={`tel:${location.phone.replaceAll(" ", "")}`}>
                    {location.phone}
                  </a>
                  <span>Luôn sẵn lòng nghe bạn</span>
                </div>
              </div>
              <div className="detail">
                <span className="detail-icon" aria-hidden="true">
                  ♡
                </span>
                <div>
                  <strong>Góc dễ thương</strong>
                  {location.amenities.map((amenity) => (
                    <span key={amenity}>{amenity}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found container">
      <span className="eyebrow">Không tìm thấy trang</span>
      <h1>Góc này chưa có trong tiệm.</h1>
      <Link className="button" to="/">
        Về trang chủ
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <>
      <ScrollProgress />
      <ScrollToLocation />
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/visit" element={<VisitPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}
