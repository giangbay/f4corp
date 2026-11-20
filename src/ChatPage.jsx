import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

function formatDate(value) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CommentForm({ postId, onComment }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSending(true);
    try {
      const comment = await fetchApi(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      onComment(comment);
      setMessage("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <p className="chat-login-prompt">
        <Link to="/login">Đăng nhập</Link> để bình luận.
      </p>
    );
  }

  return (
    <form className="chat-comment-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor={`comment-${postId}`}>
        Viết bình luận
      </label>
      <input
        id={`comment-${postId}`}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={600}
        placeholder="Viết bình luận…"
        required
      />
      <button type="submit" disabled={sending}>
        {sending ? "Đang gửi…" : "Gửi"}
      </button>
      {error && <span className="form-message-error" role="alert">{error}</span>}
    </form>
  );
}

function CommentComponent({ post, onComment, onDeleteComment }) {
  const { user } = useAuth();

  return (
    <section className="post-comments" aria-label={`Bình luận bài viết của ${post.author.name}`}>
      <h3>Bình luận ({post.comments.length})</h3>
      <div className="post-comment-list" aria-live="polite">
        {post.comments.map((comment) => (
          <article className="post-comment" key={comment.id}>
            <div className="post-comment-copy">
              <strong>{comment.author.name}</strong>
              {comment.author.role === "admin" && <span className="role-pill">Quản trị</span>}
              <p>{comment.message}</p>
              <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
            </div>
            {user?.role === "admin" && (
              <button
                className="text-button danger-button"
                type="button"
                onClick={() => onDeleteComment(post.id, comment.id)}
              >
                Xóa
              </button>
            )}
          </article>
        ))}
        {post.comments.length === 0 && (
          <p className="resource-message">Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện!</p>
        )}
      </div>
      <CommentForm postId={post.id} onComment={(comment) => onComment(post.id, comment)} />
    </section>
  );
}

function PostComponent({ post, onComment, onDelete, onDeleteComment }) {
  const { user } = useAuth();
  const canDelete = user && (user.role === "admin" || user.id === post.author.id);

  return (
    <article className="chat-post">
      <header className="post-header">
        <div className="post-avatar" aria-hidden="true">
          {post.author.name.slice(0, 1).toLocaleUpperCase("vi-VN")}
        </div>
        <div className="post-author">
          <strong>{post.author.name}</strong>
          {post.author.role === "admin" && <span className="role-pill">Quản trị viên</span>}
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </div>
        {canDelete && (
          <button
            className="text-button danger-button"
            type="button"
            onClick={() => onDelete(post.id)}
          >
            Xóa bài viết
          </button>
        )}
      </header>
      <p className="post-content">{post.content}</p>
      <CommentComponent
        post={post}
        onComment={onComment}
        onDeleteComment={onDeleteComment}
      />
    </article>
  );
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      const latestPosts = await fetchApi("/posts");
      setPosts(latestPosts);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    const socket = io();
    socket.on("chat:post-created", (post) => {
      setPosts((existing) => [post, ...existing.filter((item) => item.id !== post.id)]);
    });
    socket.on("chat:comment-created", ({ postId, comment }) => {
      setPosts((existing) => existing.map((post) => post.id !== postId
        ? post
        : {
            ...post,
            comments: [
              ...post.comments.filter((item) => item.id !== comment.id),
              comment,
            ],
          }));
    });
    socket.on("chat:post-deleted", ({ postId }) => {
      setPosts((existing) => existing.filter((post) => post.id !== postId));
    });
    socket.on("chat:comment-deleted", ({ postId, commentId }) => {
      setPosts((existing) => existing.map((post) => post.id !== postId
        ? post
        : { ...post, comments: post.comments.filter((item) => item.id !== commentId) }));
    });
    socket.on("connect_error", () => {
      setError("Không thể kết nối cập nhật trực tiếp. Hãy tải lại trang để đồng bộ.");
    });

    return () => socket.disconnect();
  }, [loadPosts]);

  function addComment(postId, comment) {
    setPosts((existing) => existing.map((post) => post.id !== postId
      ? post
      : {
          ...post,
          comments: [
            ...post.comments.filter((item) => item.id !== comment.id),
            comment,
          ],
        }));
  }

  async function createPost(event) {
    event.preventDefault();
    setActionError("");
    setSending(true);
    try {
      const post = await fetchApi("/posts", {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setPosts((existing) => [post, ...existing.filter((item) => item.id !== post.id)]);
      setContent("");
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSending(false);
    }
  }

  async function deletePost(postId) {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await fetchApi(`/posts/${postId}`, { method: "DELETE" });
      setPosts((existing) => existing.filter((post) => post.id !== postId));
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  async function deleteComment(postId, commentId) {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await fetchApi(`/admin/comments/${commentId}`, { method: "DELETE" });
      setPosts((existing) => existing.map((post) => post.id !== postId
        ? post
        : { ...post, comments: post.comments.filter((item) => item.id !== commentId) }));
    } catch (requestError) {
      setActionError(requestError.message);
    }
  }

  if (authLoading) {
    return <section className="chat-page"><p className="resource-message">Đang xác minh phiên đăng nhập…</p></section>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/chat" }} />;

  return (
    <section className="chat-page">
      <div className="chat-container">
        <div className="chat-heading">
          <span className="eyebrow">Cộng đồng Mộc Nhiên</span>
          <h1>Bảng trò chuyện</h1>
          <p>Chia sẻ khoảnh khắc, đọc câu chuyện và trò chuyện cùng mọi người.</p>
        </div>
        <form className="post-composer" onSubmit={createPost}>
          <div className="composer-heading">
            <div className="post-avatar" aria-hidden="true">
              {user.name.slice(0, 1).toLocaleUpperCase("vi-VN")}
            </div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.role === "admin" ? "Quản trị viên" : "Khách hàng"}</span>
            </div>
          </div>
          <label className="visually-hidden" htmlFor="new-post">
            Bạn đang nghĩ gì?
          </label>
          <textarea
            id="new-post"
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            placeholder="Bạn đang nghĩ gì?"
            required
          />
          <div className="composer-actions">
            <span>{content.length}/2000</span>
            <button className="button" type="submit" disabled={sending}>
              {sending ? "Đang đăng…" : "Đăng bài"}
            </button>
          </div>
          {actionError && <p className="form-message form-message-error" role="alert">{actionError}</p>}
        </form>
        <div className="chat-feed" aria-live="polite">
          {loading && <p className="resource-message">Đang tải cuộc trò chuyện…</p>}
          {!loading && error && <p className="form-message form-message-error" role="alert">{error}</p>}
          {!loading && !error && posts.length === 0 && (
            <div className="empty-chat">
              <h2>Chưa có bài đăng nào</h2>
              <p>Hãy đăng bài đầu tiên để bắt đầu trò chuyện.</p>
            </div>
          )}
          {posts.map((post) => (
            <PostComponent
              key={post.id}
              post={post}
              onComment={addComment}
              onDelete={deletePost}
              onDeleteComment={deleteComment}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
