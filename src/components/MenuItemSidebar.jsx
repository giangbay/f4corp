import { Link } from "react-router-dom";
import { getMenuItemPath } from "../menuSlug.js";

function formatReviewDate(value) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MenuItemSidebar({ products, reviewState }) {
  const { reviews, loading: reviewsLoading, error: reviewsError } = reviewState;

  return (
    <aside className="menu-item-visitor-sidebar" aria-label="Gợi ý và bình luận">
      <section className="menu-item-sidebar-section" aria-labelledby="menu-suggestions-heading">
        <span className="eyebrow">Có thể bạn sẽ thích</span>
        <h2 id="menu-suggestions-heading">Món gợi ý</h2>
        {products.length ? (
          <div className="menu-item-suggestion-list">
            {products.map((product) => (
              <Link
                className="menu-item-suggestion"
                key={product.id}
                to={getMenuItemPath(product)}
              >
                <img src={product.image} alt={product.imageAlt} loading="lazy" />
                <span>
                  <strong>{product.name}</strong>
                  <span>{product.price.toLocaleString("vi-VN")}đ</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="menu-item-sidebar-empty">Chưa có món gợi ý.</p>
        )}
      </section>

      <section className="menu-item-sidebar-section" aria-labelledby="menu-latest-reviews-heading">
        <span className="eyebrow">Chia sẻ từ khách hàng</span>
        <h2 id="menu-latest-reviews-heading">Bình luận mới</h2>
        {reviewsLoading ? (
          <p className="menu-item-sidebar-empty">Đang tải bình luận…</p>
        ) : reviewsError ? (
          <p className="menu-item-sidebar-empty">Chưa thể tải bình luận.</p>
        ) : reviews.length ? (
          <div className="menu-item-latest-reviews">
            {reviews.slice(0, 3).map((review) => (
              <article className="menu-item-latest-review" key={review.id}>
                <div>
                  <strong>{review.authorName}</strong>
                  <time dateTime={review.createdAt}>
                    {formatReviewDate(review.createdAt)}
                  </time>
                </div>
                <span className="menu-item-latest-rating" aria-label={`${review.rating} trên 5 sao`}>
                  ★ {review.rating}/5
                </span>
                <p>{review.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="menu-item-sidebar-empty">Chưa có bình luận nào cho món này.</p>
        )}
      </section>
    </aside>
  );
}
