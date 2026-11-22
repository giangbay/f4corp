import { Link } from "react-router-dom";
import { getMenuItemPath } from "../menuSlug.js";

function formatPublishDate(value) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MenuItemSidebar({
  products,
  blogPosts,
  blogLoading,
  blogError,
}) {
  return (
    <aside className="menu-item-visitor-sidebar" aria-label="Món gợi ý và blog mới">
      <section
        className="menu-item-sidebar-section"
        aria-labelledby="menu-suggestions-heading"
      >
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

      <section
        className="menu-item-sidebar-section"
        aria-labelledby="menu-latest-blog-heading"
      >
        <span className="eyebrow">Từ nhật ký của Mộc</span>
        <h2 id="menu-latest-blog-heading">Bài viết blog mới</h2>
        {blogLoading ? (
          <p className="menu-item-sidebar-empty">Đang tải bài viết…</p>
        ) : blogError ? (
          <p className="menu-item-sidebar-empty">Chưa thể tải bài viết.</p>
        ) : blogPosts.length ? (
          <div className="menu-item-latest-blog">
            {blogPosts.slice(0, 3).map((post) => (
              <article className="menu-item-latest-blog-post" key={post.id}>
                <Link to={`/blog/${post.id}`}>{post.title}</Link>
                <time dateTime={post.createdAt}>
                  {formatPublishDate(post.createdAt)}
                </time>
                <p>{post.excerpt}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="menu-item-sidebar-empty">Chưa có bài viết blog nào.</p>
        )}
        <Link className="menu-item-blog-all" to="/blog">
          Xem tất cả bài viết →
        </Link>
      </section>
    </aside>
  );
}
