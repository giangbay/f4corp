import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchApi(`/admin/analytics/page-views?days=${days}`, {
      signal: controller.signal,
    })
      .then(setReport)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [days]);

  const maxViews = Math.max(1, ...(report?.dailyViews.map(({ views }) => views) ?? []));

  return (
    <section className="admin-insight-page">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Thống kê truy cập</span>
          <h2>Lượt xem website</h2>
          <p>Thống kê lượt xem trang ghi nhận từ trình duyệt trong website.</p>
        </div>
        <label className="admin-analytics-range">
          <span>Khoảng thời gian</span>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
        </label>
      </header>

      {loading && <p className="resource-message">Đang tải lượt truy cập…</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {report && (
        <>
          <div className="admin-analytics-totals">
            <article>
              <span>Lượt xem trong {report.days} ngày</span>
              <strong>{report.totalViews.toLocaleString("vi-VN")}</strong>
            </article>
            <article>
              <span>Lượt xem hôm nay</span>
              <strong>{report.todayViews.toLocaleString("vi-VN")}</strong>
            </article>
          </div>
          <section className="admin-analytics-chart">
            <header>
              <h3>Lượt xem theo ngày</h3>
              <span>{formatDate(report.startDate)} – {formatDate(report.endDate)}</span>
            </header>
            <ol>
              {report.dailyViews.map(({ date, views }) => (
                <li key={date}>
                  <time dateTime={date}>{formatDate(date)}</time>
                  <span className="admin-analytics-bar">
                    <span style={{ width: `${(views / maxViews) * 100}%` }} />
                  </span>
                  <strong>{views.toLocaleString("vi-VN")}</strong>
                </li>
              ))}
            </ol>
          </section>
          <section className="admin-analytics-pages">
            <h3>Trang được xem nhiều</h3>
            {report.popularPages.length === 0 ? (
              <p className="resource-message">Chưa có lượt xem được ghi nhận.</p>
            ) : (
              <ol>
                {report.popularPages.map(({ path, views }) => (
                  <li key={path}>
                    <code>{path}</code>
                    <strong>{views.toLocaleString("vi-VN")}</strong>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <p className="admin-analytics-note">
            Đây là lượt xem trang, không phải số khách truy cập duy nhất. Trang quản trị và các trang đăng nhập được loại khỏi thống kê; không lưu địa chỉ IP hoặc thông tin cá nhân.
          </p>
        </>
      )}
    </section>
  );
}
