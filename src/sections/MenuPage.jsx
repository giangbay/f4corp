import { Link } from "react-router-dom";
import { useApiResource } from "../api.js";
import ResourceStatus from "../components/ResourceStatus.jsx";
import CommentsSection from "./CommentsSection.jsx";
import { getMenuItemPath } from "../menuSlug.js";

function MenuCard({ item }) {
  return (
    <article className="menu-card">
      <Link
        className="menu-card-link"
        to={getMenuItemPath(item)}
        aria-label={`Xem chi tiết ${item.name}`}
      >
        <img src={item.image} alt={item.imageAlt} loading="lazy" />
        <div className="menu-card-body">
          <div className="menu-card-title">
            <div className="menu-card-name">
              <h2>{item.name}</h2>
              {item.bestSeller && <span className="best-seller-badge">Bán chạy</span>}
            </div>
            <span className="price">{item.price.toLocaleString("vi-VN")}đ</span>
          </div>
          <p>{item.description}</p>
          <span className="menu-card-more">Xem chi tiết món <span aria-hidden="true">→</span></span>
        </div>
      </Link>
    </article>
  );
}

export default function MenuPage() {
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
