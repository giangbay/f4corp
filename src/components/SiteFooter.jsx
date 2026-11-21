import { Link } from "react-router-dom";

export default function SiteFooter() {
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
