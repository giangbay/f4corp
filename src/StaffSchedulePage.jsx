import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi, useApiResource } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

function formatShiftDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    weekday: "short",
  });
}

export default function StaffSchedulePage() {
  const { user } = useAuth();
  const { data: shifts, loading, error } = useApiResource("/staff-shifts");
  const [savedShifts, setSavedShifts] = useState([]);
  const [shiftDate, setShiftDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [realtimeError, setRealtimeError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const socket = io();
    socket.on("connect", () => setRealtimeError(""));
    socket.on("connect_error", () => {
      setRealtimeError("Không thể kết nối cập nhật lịch trực tiếp.");
    });
    socket.on("staff-shift:created", (shift) => {
      setSavedShifts((existing) => [
        shift,
        ...existing.filter((item) => item.id !== shift.id),
      ]);
    });
    return () => socket.disconnect();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const shift = await fetchApi("/staff-shifts", {
        method: "POST",
        body: JSON.stringify({ shiftDate, startTime, endTime, note }),
      });
      setSavedShifts((existing) => [
        shift,
        ...existing.filter((item) => item.id !== shift.id),
      ]);
      setNote("");
    } catch (requestError) {
      setSubmitError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleShifts = Array.from(
    new Map(
      [...savedShifts, ...shifts].map((shift) => [shift.id, shift]),
    ).values(),
  ).sort((first, second) =>
    first.shiftDate.localeCompare(second.shiftDate) ||
    first.startTime.localeCompare(second.startTime),
  );

  return (
    <section className="staff-shifts">
      <div className="shift-container">
        <header className="shift-heading">
          <span className="eyebrow">Lịch làm việc tại Mộc</span>
          <h1>Đăng ký giờ làm</h1>
          <p>
            Bảng lịch chung để mọi người cùng xem. Nhân viên và quản trị viên
            đăng nhập để thêm khung giờ có thể làm.
          </p>
        </header>
        <div className="shift-content">
          <section className="shift-panel">
            <h2>Thêm khung giờ</h2>
            {user && ["staff", "admin"].includes(user.role) ? (
              <form className="shift-form" onSubmit={handleSubmit}>
                <label htmlFor="shift-date">Ngày làm</label>
                <input
                  id="shift-date"
                  type="date"
                  value={shiftDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setShiftDate(event.target.value)}
                  required
                />
                <div className="shift-time-fields">
                  <div>
                    <label htmlFor="shift-start">Bắt đầu</label>
                    <input
                      id="shift-start"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shift-end">Kết thúc</label>
                    <input
                      id="shift-end"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <label htmlFor="shift-note">Ghi chú (không bắt buộc)</label>
                <textarea
                  id="shift-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={300}
                  rows={3}
                />
                {submitError && (
                  <p className="form-message form-message-error" role="alert">
                    {submitError}
                  </p>
                )}
                <button className="button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đăng ký…" : "Đăng ký giờ làm"}
                </button>
              </form>
            ) : (
              <p className="shift-access-message">
                {user ? (
                  "Chỉ tài khoản nhân viên hoặc quản trị viên mới có thể đăng ký giờ làm."
                ) : (
                  <>
                    <Link to="/login" state={{ from: "/shifts" }}>
                      Đăng nhập bằng tài khoản nhân viên hoặc quản trị viên
                    </Link>{" "}
                    để đăng ký giờ làm.
                  </>
                )}
              </p>
            )}
          </section>
          <section className="shift-board" aria-labelledby="shift-board-title">
            <div className="shift-board-heading">
              <h2 id="shift-board-title">Lịch đăng ký chung</h2>
              <span>{visibleShifts.length} khung giờ</span>
            </div>
            {loading && <p className="resource-message">Đang tải lịch…</p>}
            {error && (
              <p className="form-message form-message-error" role="alert">
                {error}
              </p>
            )}
            {realtimeError && (
              <p className="form-message form-message-error" role="alert">
                {realtimeError}
              </p>
            )}
            {!loading && !error && visibleShifts.length === 0 && (
              <p className="resource-message">Chưa có khung giờ nào được đăng ký.</p>
            )}
            {!error && visibleShifts.length > 0 && (
              <div className="shift-table-wrap">
                <table className="shift-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Giờ</th>
                      <th>Người đăng ký</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleShifts.map((shift) => (
                      <tr key={shift.id}>
                        <td>{formatShiftDate(shift.shiftDate)}</td>
                        <td>
                          <time dateTime={`${shift.shiftDate}T${shift.startTime}`}>
                            {shift.startTime}–{shift.endTime}
                          </time>
                        </td>
                        <td>{shift.staffName}</td>
                        <td>{shift.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
