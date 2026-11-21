import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi, useApiResource } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import ResourceStatus from "../components/ResourceStatus.jsx";

export default function CommentsSection() {
  const { user } = useAuth();
  const { data: comments, loading, error } = useApiResource("/comments");
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedComments, setSavedComments] = useState([]);
  const [realtimeError, setRealtimeError] = useState("");

  useEffect(() => {
    const socket = io();
    socket.on("connect", () => setRealtimeError(""));
    socket.on("connect_error", () => {
      setRealtimeError(
        "Không thể kết nối cập nhật bình luận trực tiếp. Hãy tải lại trang để đồng bộ.",
      );
    });
    socket.on("comments:created", (comment) => {
      setSavedComments((existing) => [
        comment,
        ...existing.filter((item) => item.id !== comment.id),
      ]);
    });

    return () => socket.disconnect();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const comment = await fetchApi("/comments", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSavedComments((existing) => [comment, ...existing]);
      setMessage("");
    } catch (submitFailure) {
      setSubmitError(submitFailure.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleComments = Array.from(
    new Map(
      [...savedComments, ...comments].map((comment) => [comment.id, comment]),
    ).values(),
  );

  return (
    <section className="comments-section">
      <div className="comments-layout container">
        <div>
          <span className="eyebrow">Lời thương gửi Mộc</span>
          <h2>Góc chia sẻ</h2>
          <p className="comments-intro">
            Để lại vài dòng cảm nhận sau lần ghé thăm của bạn nhé.
          </p>
          {user ? (
            <form className="comment-form" onSubmit={handleSubmit}>
              <label htmlFor="comment-message">
                Bình luận với tên {user.name}
              </label>
              <textarea
                id="comment-message"
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                minLength={2}
                maxLength={600}
                rows={4}
                required
              />
              {submitError && (
                <p className="form-message form-message-error" role="alert">
                  {submitError}
                </p>
              )}
              <button className="button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi…" : "Đăng bình luận"}
              </button>
            </form>
          ) : (
            <p className="comments-intro">
              <Link to="/login">Đăng nhập</Link> để gửi bình luận.
            </p>
          )}
        </div>
        <div className="comments-list" aria-live="polite">
          <ResourceStatus loading={loading} error={error} />
          {realtimeError && (
            <p className="form-message form-message-error" role="alert">
              {realtimeError}
            </p>
          )}
          {!loading && !error && visibleComments.length === 0 && (
            <p className="resource-message">Chưa có bình luận nào.</p>
          )}
          {visibleComments.map((comment) => (
            <article className="comment-card" key={comment.id}>
              <strong>{comment.name}</strong>
              <p>{comment.message}</p>
              <time dateTime={comment.createdAt}>
                {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
              </time>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
