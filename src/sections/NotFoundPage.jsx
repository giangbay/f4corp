import { Link } from "react-router-dom";

export default function NotFoundPage() {
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
