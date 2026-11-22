import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { fetchApi, useApiResource } from "../api.js";

function formatPublishDate(value) {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BlogPostForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPost(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const post = await fetchApi("/blog", {
        method: "POST",
        body: JSON.stringify({ title, excerpt, content }),
      });
      setTitle("");
      setExcerpt("");
      setContent("");
      onCreated(post);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="blog-editor" aria-labelledby="blog-editor-heading">
      <div>
        <span className="eyebrow">Khu vực quản trị</span>
        <h2 id="blog-editor-heading">Đăng bài viết mới</h2>
      </div>
      <form className="blog-editor-form" onSubmit={submitPost}>
        <label htmlFor="blog-title">Tiêu đề</label>
        <input
          id="blog-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          minLength={3}
          maxLength={160}
          required
        />
        <label htmlFor="blog-excerpt">Mô tả ngắn</label>
        <textarea
          id="blog-excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          maxLength={400}
          rows={2}
          placeholder="Một vài dòng giới thiệu cho danh sách blog…"
        />
        <label htmlFor="blog-content">Nội dung</label>
        <textarea
          id="blog-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          minLength={20}
          maxLength={50000}
          rows={8}
          required
        />
        <span className="admin-character-count">{content.length}/50.000 ký tự</span>
        {error && <p className="form-message form-message-error" role="alert">{error}</p>}
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng…" : "Đăng bài"}
        </button>
      </form>
    </section>
  );
}

function ArticleCard({ article }) {
  const excerpt = article.excerpt || `${article.content?.slice(0, 260) ?? ""}…`;
  return (
    <article className="blog-card">
      <span className="eyebrow">Blog Mộc Nhiên</span>
      <h2>
        <Link to={`/blog/${article.id}`}>{article.title}</Link>
      </h2>
      <p className="blog-card-excerpt">{excerpt}</p>
      <div className="blog-card-meta">
        <span>{article.authorName}</span>
        <time dateTime={article.createdAt}>{formatPublishDate(article.createdAt)}</time>
      </div>
      <Link className="text-link" to={`/blog/${article.id}`}>
        Đọc bài viết →
      </Link>
    </article>
  );
}

export default function BlogPage() {
  const { blogId } = useParams();
  const { user } = useAuth();
  const resource = useApiResource(blogId ? `/blog/${blogId}` : "/blog");
  const [notice, setNotice] = useState("");
  const isAdmin = user?.role === "admin";

  if (blogId) {
    const article = resource.data?.id ? resource.data : null;
    return (
      <section className="blog-page">
        <div className="blog-container">
          <Link className="text-link" to="/blog">← Tất cả bài viết</Link>
          {resource.loading && <p className="resource-message">Đang tải bài viết…</p>}
          {resource.error && (
            <p className="form-message form-message-error" role="alert">{resource.error}</p>
          )}
          {article && (
            <article className="blog-article">
              <span className="eyebrow">Blog Mộc Nhiên</span>
              <h1>{article.title}</h1>
              <div className="blog-card-meta">
                <span>{article.authorName}</span>
                <time dateTime={article.createdAt}>
                  {formatPublishDate(article.createdAt)}
                </time>
              </div>
              {article.excerpt && <p className="blog-article-excerpt">{article.excerpt}</p>}
              <div className="blog-article-content">{article.content}</div>
            </article>
          )}
        </div>
      </section>
    );
  }

  const articles = Array.isArray(resource.data) ? resource.data : [];

  return (
    <section className="blog-page">
      <div className="blog-container">
        <header className="blog-heading">
          <span className="eyebrow">Nhật ký từ Mộc</span>
          <h1>Blog Mộc Nhiên</h1>
          <p>Những câu chuyện, hương vị và góc nhỏ bình yên từ quán.</p>
        </header>
        {isAdmin && (
          <BlogPostForm
            onCreated={(post) => {
              resource.setData((existing) => [
                post,
                ...(Array.isArray(existing) ? existing : []),
              ]);
              setNotice("Bài viết đã được đăng.");
            }}
          />
        )}
        {notice && <p className="form-message form-message-success" role="status">{notice}</p>}
        {resource.loading && <p className="resource-message">Đang tải bài viết…</p>}
        {resource.error && (
          <p className="form-message form-message-error" role="alert">{resource.error}</p>
        )}
        {!resource.loading && !resource.error && articles.length === 0 && (
          <p className="blog-empty">Chưa có bài viết nào. Mời bạn quay lại sau nhé.</p>
        )}
        {!resource.error && articles.length > 0 && (
          <div className="blog-grid">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
