import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi, useApiResource } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const SHIFT_OPTIONS = [
  { name: "Sáng", tone: "morning", startTime: "07:00", endTime: "12:00" },
  { name: "Chiều", tone: "afternoon", startTime: "12:00", endTime: "17:00" },
  { name: "Tối", tone: "evening", startTime: "17:00", endTime: "22:00" },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date);
}

function formatDayMonth(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function StaffSchedulePage() {
  const { user } = useAuth();
  const { data: shifts, loading, error } = useApiResource("/staff-shifts");
  const [savedShifts, setSavedShifts] = useState([]);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [realtimeError, setRealtimeError] = useState("");
  const [submittingSlot, setSubmittingSlot] = useState("");
  const [cancellingShiftId, setCancellingShiftId] = useState("");

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
    socket.on("staff-shift:deleted", ({ id }) => {
      setSavedShifts((existing) =>
        existing.filter((shift) => String(shift.id) !== String(id)),
      );
    });
    return () => socket.disconnect();
  }, []);

  async function registerShift(shiftDate, shiftOption) {
    setSubmitError("");
    const slotKey = `${shiftDate}:${shiftOption.startTime}`;
    setSubmittingSlot(slotKey);

    try {
      const shift = await fetchApi("/staff-shifts", {
        method: "POST",
        body: JSON.stringify({
          shiftDate,
          startTime: shiftOption.startTime,
          endTime: shiftOption.endTime,
          note,
        }),
      });
      setSavedShifts((existing) => [
        shift,
        ...existing.filter((item) => item.id !== shift.id),
      ]);
      setNote("");
    } catch (requestError) {
      setSubmitError(requestError.message);
    } finally {
      setSubmittingSlot("");
    }
  }

  async function cancelShift(shift) {
    if (
      !window.confirm(
        `Bạn có chắc muốn hủy ca ${shift.startTime}–${shift.endTime} ngày ${shift.shiftDate}?`,
      )
    ) {
      return;
    }

    setSubmitError("");
    setCancellingShiftId(String(shift.id));
    try {
      await fetchApi(`/staff-shifts/${shift.id}`, { method: "DELETE" });
      setSavedShifts((existing) =>
        existing.filter((item) => String(item.id) !== String(shift.id)),
      );
    } catch (requestError) {
      setSubmitError(requestError.message);
    } finally {
      setCancellingShiftId("");
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
  const today = new Date();
  const todayKey = formatDateKey(today);
  const upcomingDays = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
  const upcomingDateKeys = new Set(upcomingDays.map(formatDateKey));
  const upcomingShifts = visibleShifts.filter((shift) =>
    upcomingDateKeys.has(shift.shiftDate),
  );
  const todayTime = `${String(today.getHours()).padStart(2, "0")}:${String(
    today.getMinutes(),
  ).padStart(2, "0")}`;

  return (
    <section className="staff-shifts">
      <div className="shift-container">
        <header className="shift-heading">
          <span className="eyebrow">Lịch làm việc tại Mộc</span>
          <h1>Đăng ký giờ làm</h1>
          <p>
            Chọn ca trong 3 ngày gần nhất. Mỗi ca tối đa 2 nhân viên.
          </p>
        </header>
        <div className="shift-content">
          <section className="shift-board" aria-labelledby="shift-board-title">
            <div className="shift-board-heading">
              <div>
                <h2 id="shift-board-title">Lịch đăng ký chung</h2>
                <span className="shift-week-range">
                  {formatDayMonth(upcomingDays[0])} –{" "}
                  {formatDayMonth(upcomingDays[upcomingDays.length - 1])}
                </span>
              </div>
            </div>
            <p className="shift-week-count">
              Lịch 07:00–23:00 · Ca tối kết thúc lúc 22:00, không đăng ký 22:00–23:00 ·{" "}
              {upcomingShifts.length} lượt trong 3 ngày
            </p>
            {user && ["staff", "admin"].includes(user.role) ? (
              <div className="shift-note-field">
                <label htmlFor="shift-note">Ghi chú cho ca đăng ký (không bắt buộc)</label>
                <textarea
                  id="shift-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={300}
                  rows={2}
                />
              </div>
            ) : (
              <p className="shift-access-message">
                {user ? (
                  "Chỉ tài khoản nhân viên hoặc quản trị viên mới có thể đăng ký ca."
                ) : (
                  <>
                    <Link to="/login" state={{ from: "/shifts" }}>
                      Đăng nhập bằng tài khoản nhân viên hoặc quản trị viên
                    </Link>{" "}
                    để đăng ký ca.
                  </>
                )}
              </p>
            )}
            {submitError && (
              <p className="form-message form-message-error" role="alert">
                {submitError}
              </p>
            )}
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
            {!error && (
              <div className="shift-week-scroll">
                <div className="shift-week-grid">
                  <div className="shift-time-axis-row" aria-hidden="true">
                    <span className="shift-time-axis-title">Ngày / giờ</span>
                    <div className="shift-time-axis">
                      {Array.from({ length: 16 }, (_, index) => index + 7).map(
                        (hour) => (
                          <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
                        ),
                      )}
                      <span className="shift-time-axis-end">23:00</span>
                    </div>
                  </div>
                  {upcomingDays.map((date) => {
                    const dateKey = formatDateKey(date);
                    const dayShifts = upcomingShifts.filter(
                      (shift) => shift.shiftDate === dateKey,
                    );
                    const isPastDate = dateKey < todayKey;
                    const dayTitle =
                      dateKey === todayKey
                        ? "Hôm nay"
                        : dateKey === formatDateKey(upcomingDays[1])
                          ? "Ngày mai"
                          : "Ngày kia";

                    return (
                      <section
                        className={`shift-day${dateKey === todayKey ? " is-today" : ""}`}
                        key={dateKey}
                        aria-label={`${formatWeekday(date)} ${date.getDate()}`}
                      >
                        <header className="shift-day-heading">
                          <span>{dayTitle}</span>
                          <strong>{date.getDate()}</strong>
                          <span className="shift-day-month">
                            {new Intl.DateTimeFormat("vi-VN", {
                              month: "short",
                            }).format(date)}
                          </span>
                        </header>
                        <div className="shift-day-timeline">
                          {SHIFT_OPTIONS.map((shiftOption) => {
                            const slotShifts = dayShifts.filter(
                              (shift) =>
                                shift.startTime === shiftOption.startTime &&
                                shift.endTime === shiftOption.endTime,
                            );
                            const alreadyRegistered = slotShifts.some(
                              (shift) => String(shift.userId) === String(user?.id),
                            );
                            const isFull = slotShifts.length >= 2;
                            const isPastShift =
                              isPastDate ||
                              (dateKey === todayKey &&
                                todayTime >= shiftOption.endTime);
                            const slotKey = `${dateKey}:${shiftOption.startTime}`;
                            const isEligible =
                              user && ["staff", "admin"].includes(user.role);

                            return (
                              <article
                                className={`shift-slot shift-slot-${shiftOption.tone}${isFull ? " is-full" : ""}`}
                                style={{
                                  gridColumn: `${
                                    Number(shiftOption.startTime.slice(0, 2)) - 6
                                  } / span 5`,
                                }}
                                key={shiftOption.startTime}
                              >
                                <div className="shift-slot-time">
                                  <span>{shiftOption.name}</span>
                                  <time
                                    dateTime={`${shiftOption.startTime}/${shiftOption.endTime}`}
                                  >
                                    {shiftOption.startTime}–{shiftOption.endTime}
                                  </time>
                                </div>
                                <div className="shift-slot-staff">
                                  {slotShifts.map((registeredShift) => {
                                    const canCancel =
                                      user?.role === "admin" ||
                                      (user?.role === "staff" &&
                                        String(registeredShift.userId) ===
                                          String(user.id));
                                    return (
                                      <div
                                        className="shift-slot-person"
                                        key={registeredShift.id}
                                      >
                                        <strong>{registeredShift.staffName}</strong>
                                        {registeredShift.note && (
                                          <span>{registeredShift.note}</span>
                                        )}
                                        {canCancel && (
                                          <button
                                            className="shift-cancel-button"
                                            type="button"
                                            disabled={
                                              cancellingShiftId ===
                                              String(registeredShift.id)
                                            }
                                            onClick={() =>
                                              cancelShift(registeredShift)
                                            }
                                          >
                                            {cancellingShiftId ===
                                            String(registeredShift.id)
                                              ? "Đang hủy…"
                                              : "Hủy ca"}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="shift-slot-action">
                                  <span>
                                    {slotShifts.length}/2 nhân viên
                                  </span>
                                  {isEligible && (
                                    <button
                                      className="shift-register-button"
                                      type="button"
                                      disabled={
                                        loading ||
                                        isPastShift ||
                                        isFull ||
                                        alreadyRegistered ||
                                        submittingSlot === slotKey
                                      }
                                      onClick={() =>
                                        registerShift(dateKey, shiftOption)
                                      }
                                    >
                                      {submittingSlot === slotKey
                                        ? "Đang đăng ký…"
                                        : alreadyRegistered
                                          ? "Đã đăng ký"
                                          : isFull
                                            ? "Đã đủ người"
                                            : isPastShift
                                              ? "Đã qua"
                                              : "Đăng ký ca"}
                                    </button>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
