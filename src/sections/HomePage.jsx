import { Link } from "react-router-dom";

export default function HomePage() {
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
          src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=75"
          srcSet={[
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=480&q=75 480w",
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=768&q=75 768w",
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=75 1200w",
          ].join(", ")}
          sizes="(max-width: 576px) calc(100vw - 54px), (max-width: 760px) 522px, (max-width: 1168px) 50vw, 560px"
          alt="Tách cà phê được pha trong không gian ấm áp"
          width="1200"
          height="800"
          fetchPriority="high"
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
