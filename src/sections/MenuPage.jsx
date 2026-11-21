import { useState } from "react";
import { Link } from "react-router-dom";
import { useApiResource } from "../api.js";
import ResourceStatus from "../components/ResourceStatus.jsx";
import CommentsSection from "./CommentsSection.jsx";
import { getMenuCategoryLabel, MENU_CATEGORIES } from "../menuCategories.js";
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
              {Boolean(item.bestSeller) && (
                <span className="best-seller-badge">Bán chạy</span>
              )}
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const visibleItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.category === selectedCategory);

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
            <>
              <nav className="menu-category-nav" aria-label="Danh mục thực đơn">
                <button
                  type="button"
                  aria-pressed={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                >
                  Tất cả <span>{items.length}</span>
                </button>
                {MENU_CATEGORIES.map((category) => {
                  const count = items.filter(
                    (item) => item.category === category.value,
                  ).length;
                  return (
                    <button
                      type="button"
                      key={category.value}
                      aria-pressed={selectedCategory === category.value}
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label} <span>{count}</span>
                    </button>
                  );
                })}
              </nav>
              {visibleItems.length > 0 ? (
                <div className="menu-grid">
                  {visibleItems.map((item) => (
                    <MenuCard item={item} key={item.id} />
                  ))}
                </div>
              ) : (
                <div className="menu-category-empty">
                  <span className="eyebrow">
                    {getMenuCategoryLabel(selectedCategory)}
                  </span>
                  <p>Danh mục này đang được cập nhật. Mời bạn quay lại sau nhé.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <CommentsSection />
    </>
  );
}
