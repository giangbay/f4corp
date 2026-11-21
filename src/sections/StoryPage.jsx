import { Link } from "react-router-dom";

export default function StoryPage() {
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
