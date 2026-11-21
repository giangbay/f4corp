import { useApiResource } from "../api.js";
import ResourceStatus from "../components/ResourceStatus.jsx";
import CommentsSection from "./CommentsSection.jsx";

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
