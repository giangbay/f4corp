export default function ResourceStatus({ loading, error }) {
  if (loading) return <p className="resource-message">Đang tải dữ liệu…</p>;
  if (error) {
    return (
      <p className="form-message form-message-error" role="alert">
        {error}
      </p>
    );
  }
  return null;
}
