import CommentsSection from "./CommentsSection.jsx";

export default function SpacePage() {
  return (
    <>
      <section className="intro space-page" id="khong-gian">
        <div className="intro-grid container">
          <div className="intro-copy">
            <span className="eyebrow">Không gian Mộc Nhiên</span>
            <h1>
              Một góc yên,
              <br />
              để ở lại lâu.
            </h1>
            <p>
              Không gian của Mộc Nhiên được chăm chút bằng chất liệu gỗ mộc,
              ánh sáng dịu và những chỗ ngồi quen thuộc. Bạn có thể chọn góc
              yên đọc sách, bàn gần cửa sổ hay khu vực trò chuyện cùng bạn bè.
            </p>
            <p>
              Chúng mình giữ không gian vừa đủ ấm áp để bạn làm việc, gặp gỡ
              và thưởng thức cà phê thật chậm rãi.
            </p>
          </div>
          <div className="intro-photo-wrap">
            <img
              className="intro-photo"
              src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1100&q=85"
              alt="Góc không gian quán cà phê Mộc Nhiên"
              loading="lazy"
            />
          </div>
        </div>
      </section>
      <CommentsSection />
    </>
  );
}
