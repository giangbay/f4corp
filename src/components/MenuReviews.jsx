import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

const EMPTY_REVIEWS = {
  reviews: [],
  totalReviews: 0,
  averageRating: 0,
  ownReview: null,
};

function StarDisplay({ rating }) {
  return (
    <span className="review-stars" aria-label={`${rating} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          aria-hidden="true"
          className={index < rating ? "is-filled" : ""}
          key={index}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function MenuReviews({ menuId, menuName }) {
  const { user, loading: authLoading } = useAuth();
  const [reviewData, setReviewData] = useState(EMPTY_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    setReviewData(EMPTY_REVIEWS);

    fetchApi(`/menu/${menuId}/reviews`, { signal: controller.signal })
      .then((data) => {
        setReviewData(data);
        if (data.ownReview) {
          setRating(data.ownReview.rating);
          setContent(data.ownReview.content);
        } else {
          setRating(5);
          setContent("");
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [menuId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await fetchApi(`/menu/${menuId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, content }),
      });
      const updatedData = await fetchApi(`/menu/${menuId}/reviews`);
      setReviewData(updatedData);
      setSuccess("Cảm ơn bạn đã chia sẻ cảm nhận về món này.");
    } catch (error) {
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="menu-reviews" aria-labelledby="menu-reviews-heading">
      <div className="menu-reviews-heading">
        <div>
          <span className="eyebrow">Cảm nhận từ khách hàng</span>
          <h2 id="menu-reviews-heading">Đánh giá {menuName}</h2>
        </div>
        <div className="menu-review-summary">
          <strong>{reviewData.averageRating.toLocaleString("vi-VN", {
            maximumFractionDigits: 1,
          })}</strong>
          <StarDisplay rating={Math.round(reviewData.averageRating)} />
          <span>{reviewData.totalReviews} đánh giá</span>
        </div>
      </div>

      <div className="menu-reviews-layout">
        <div className="menu-review-list">
          {loading && <p className="resource-message">Đang tải đánh giá…</p>}
          {loadError && (
            <p className="form-message form-message-error" role="alert">
              {loadError}
            </p>
          )}
          {!loading && !loadError && reviewData.reviews.length === 0 && (
            <div className="menu-review-empty">
              <span aria-hidden="true">✦</span>
              <p>Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận.</p>
            </div>
          )}
          {!loadError &&
            reviewData.reviews.map((review) => (
              <article className="menu-review-card" key={review.id}>
                <div className="menu-review-card-heading">
                  <div className="menu-review-author">
                    <span className="menu-review-avatar" aria-hidden="true">
                      {review.authorName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{review.authorName}</strong>
                      <time dateTime={review.createdAt}>
                        {new Date(review.createdAt).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                  <StarDisplay rating={review.rating} />
                </div>
                <p>{review.content}</p>
              </article>
            ))}
        </div>

        <div className="menu-review-form-card">
          <h3>{reviewData.ownReview ? "Cập nhật đánh giá" : "Chia sẻ cảm nhận"}</h3>
          {authLoading ? (
            <p className="resource-message">Đang kiểm tra tài khoản…</p>
          ) : user?.role === "customer" ? (
            <form className="menu-review-form" onSubmit={handleSubmit}>
              <fieldset>
                <legend>Chấm điểm món ăn</legend>
                <div className="menu-review-rating-input" role="radiogroup">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      className={value <= rating ? "is-selected" : ""}
                      key={value}
                    >
                      <input
                        type="radio"
                        name="review-rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        aria-label={`${value} sao`}
                      />
                      <span aria-hidden="true">★</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label htmlFor={`review-content-${menuId}`}>Nhận xét của bạn</label>
              <textarea
                id={`review-content-${menuId}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                minLength={3}
                maxLength={600}
                rows={4}
                placeholder="Hương vị, cách trình bày hoặc điều bạn yêu thích…"
                required
              />
              <span className="admin-character-count">{content.length}/600 ký tự</span>
              {formError && (
                <p className="form-message form-message-error" role="alert">
                  {formError}
                </p>
              )}
              {success && (
                <p className="form-message form-message-success" role="status">
                  {success}
                </p>
              )}
              <button
                className="button"
                type="submit"
                disabled={isSubmitting || loading || Boolean(loadError)}
              >
                {isSubmitting
                  ? "Đang gửi…"
                  : reviewData.ownReview
                    ? "Lưu đánh giá"
                    : "Gửi đánh giá"}
              </button>
            </form>
          ) : user ? (
            <p className="menu-review-login-note">
              Đánh giá sản phẩm dành cho tài khoản khách hàng.
            </p>
          ) : (
            <p className="menu-review-login-note">
              <Link to="/login" state={{ from: window.location.pathname }}>
                Đăng nhập bằng tài khoản khách hàng
              </Link>{" "}
              để gửi đánh giá.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
