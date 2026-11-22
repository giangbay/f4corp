import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [
    days ? `${days} ngày` : "",
    hours ? `${hours} giờ` : "",
    `${minutes} phút`,
  ].filter(Boolean).join(" ");
}

function formatCheckedAt(value) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchApi("/admin/website/health", { signal: controller.signal })
      .then(setHealth)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  const services = health
    ? [
        {
          name: "API ứng dụng",
          status: health.api.status,
          detail: `Đang hoạt động · uptime ${formatUptime(health.api.uptimeSeconds)}`,
        },
        {
          name: "Cơ sở dữ liệu",
          status: health.database.status,
          detail: health.database.status === "ok"
            ? `Phản hồi trong ${health.database.responseTimeMs} ms`
            : "Không thể kết nối cơ sở dữ liệu; xem log máy chủ để biết chi tiết.",
        },
      ]
    : [];

  return (
    <section className="admin-insight-page">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Vận hành</span>
          <h2>Sức khỏe website</h2>
          <p>Trạng thái API và kết nối cơ sở dữ liệu tại thời điểm kiểm tra.</p>
        </div>
        <button
          className="button button-outline"
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          {loading ? "Đang kiểm tra…" : "Kiểm tra lại"}
        </button>
      </header>

      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {loading && !health && <p className="resource-message">Đang kiểm tra website…</p>}
      {health && (
        <>
          <div className={`admin-health-summary is-${health.status}`}>
            <span className="admin-status-pill">
              {health.status === "healthy" ? "Hoạt động bình thường" : "Cần kiểm tra"}
            </span>
            <p>
              Lần kiểm tra gần nhất: <time dateTime={health.checkedAt}>{formatCheckedAt(health.checkedAt)}</time>
            </p>
          </div>
          <div className="admin-health-services">
            {services.map((service) => (
              <article className="admin-health-service" key={service.name}>
                <div>
                  <span className={`admin-health-indicator is-${service.status}`} aria-hidden="true" />
                  <h3>{service.name}</h3>
                </div>
                <span className={`admin-status-pill is-${service.status}`}>
                  {service.status === "ok" ? "Đang hoạt động" : "Không khả dụng"}
                </span>
                <p>{service.detail}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
