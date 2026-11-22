import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";

const STATUS_LABELS = {
  ok: "Đạt",
  warning: "Cần cải thiện",
  error: "Lỗi",
};

export default function AdminSeoPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchApi("/admin/website/seo", { signal: controller.signal })
      .then(setReport)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const issues = report?.checks.filter((check) => check.status !== "ok").length ?? 0;

  return (
    <section className="admin-insight-page">
      <header className="admin-section-heading">
        <div>
          <span className="eyebrow">Khả năng tìm kiếm</span>
          <h2>Tình trạng SEO</h2>
          <p>Kiểm tra nhanh các thiết lập SEO kỹ thuật hiện có của website.</p>
        </div>
      </header>

      {loading && <p className="resource-message">Đang kiểm tra cấu hình SEO…</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {report && (
        <>
          <div className="admin-seo-overview">
            <div>
              <span>URL có trong sitemap</span>
              <strong>{report.indexableUrlCount}</strong>
            </div>
            <div>
              <span>Domain hiện tại</span>
              <strong className="admin-seo-domain">{report.siteUrl}</strong>
            </div>
            <p>
              {issues === 0
                ? "Các kiểm tra SEO kỹ thuật cơ bản đều đạt."
                : `${issues} mục cần xem lại hoặc hoàn thiện.`}
            </p>
          </div>
          <div className="admin-seo-checks">
            {report.checks.map((check) => (
              <article className={`admin-seo-check is-${check.status}`} key={check.id}>
                <div className="admin-seo-check-heading">
                  <h3>{check.label}</h3>
                  <span className={`admin-status-pill is-${check.status}`}>
                    {STATUS_LABELS[check.status]}
                  </span>
                </div>
                <p>{check.detail}</p>
                {check.href && (
                  <a href={check.href} target="_blank" rel="noreferrer">
                    Mở {check.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className="admin-seo-disclaimer">
            Đây là kiểm tra kỹ thuật nội bộ, không phải thứ hạng tìm kiếm hay dữ liệu Google Search Console.
          </p>
        </>
      )}
    </section>
  );
}
