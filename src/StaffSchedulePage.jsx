import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi, useApiResource } from "./api.js";
import { useAuth } from "./AuthContext.jsx";
import StaffPayrollSection from "./StaffPayrollSection.jsx";

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

function getScheduleDates(today) {
  return Array.from({ length: 9 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - 2);
    date.setHours(12, 0, 0, 0);
    return date;
  });
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
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    formatDateKey(new Date()),
  );
  const touchStartX = useRef(null);

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
  const scheduleDates = getScheduleDates(today);
  const registrationEnd = new Date(today);
  registrationEnd.setDate(today.getDate() + 6);
  const registrationEndKey = formatDateKey(registrationEnd);
  const selectedDayIndex = scheduleDates.findIndex(
    (date) => formatDateKey(date) === selectedDayKey,
  );
  const activeDayIndex =
    selectedDayIndex === -1
      ? scheduleDates.findIndex((date) => formatDateKey(date) === todayKey)
      : selectedDayIndex;
  const selectedDate = scheduleDates[activeDayIndex];
  const selectedDateKey = formatDateKey(selectedDate);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);
  const selectedDayShifts = visibleShifts.filter(
    (shift) => shift.shiftDate === selectedDateKey,
  );
  const registrationWindowShifts = visibleShifts.filter(
    (shift) =>
      shift.shiftDate >= todayKey && shift.shiftDate <= registrationEndKey,
  );
  const todayTime = `${String(today.getHours()).padStart(2, "0")}:${String(
    today.getMinutes(),
  ).padStart(2, "0")}`;
  const canSelectPreviousDay = activeDayIndex > 0;
  const canSelectNextDay = activeDayIndex < scheduleDates.length - 1;

  function selectAdjacentDay(direction) {
    const nextIndex = activeDayIndex + direction;
    if (nextIndex < 0 || nextIndex >= scheduleDates.length) return;
    setSelectedDayKey(formatDateKey(scheduleDates[nextIndex]));
  }

  function handleDayTouchStart(event) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleDayTouchEnd(event) {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45) return;
    selectAdjacentDay(distance < 0 ? 1 : -1);
  }

  return (
    <section className="staff-shifts">
      <div className="shift-container">
        <header className="shift-heading">
          <span className="eyebrow">Lịch làm việc tại Mộc</span>
          <h1>Đăng ký giờ làm</h1>
          <p>
            Đăng ký ca trong 7 ngày tới. Có thể xem thêm 2 ngày vừa qua;
            mỗi ca tối đa 2 nhân viên.
          </p>
        </header>
        <div className="shift-content">
          <section className="shift-board" aria-labelledby="shift-board-title">
            <div className="shift-board-heading">
              <div>
                <h2 id="shift-board-title">Lịch đăng ký chung</h2>
                <span className="shift-week-range">
                  {formatDayMonth(today)} – {formatDayMonth(registrationEnd)}
                </span>
              </div>
            </div>
            <p className="shift-week-count">
              Lịch 07:00–23:00 · Ca tối kết thúc lúc 22:00, không đăng ký 22:00–23:00 ·{" "}
              {registrationWindowShifts.length} lượt trong 7 ngày
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
              <div className="shift-day-carousel">
                <div className="shift-day-navigation">
                  <button
                    className="shift-day-arrow"
                    type="button"
                    aria-label="Xem ngày trước"
                    disabled={!canSelectPreviousDay}
                    onClick={() => selectAdjacentDay(-1)}
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <div className="shift-day-current" aria-live="polite">
                    <span>
                      {selectedDateKey === todayKey
                        ? "Hôm nay"
                        : selectedDateKey < todayKey
                          ? selectedDateKey === yesterdayKey
                            ? "Hôm qua"
                            : "Hai ngày trước"
                          : formatWeekday(selectedDate)}
                    </span>
                    <strong>{selectedDate.getDate()}</strong>
                    <span>
                      {new Intl.DateTimeFormat("vi-VN", {
                        month: "long",
                        year: "numeric",
                      }).format(selectedDate)}
                    </span>
                  </div>
                  <button
                    className="shift-day-arrow"
                    type="button"
                    aria-label="Xem ngày tiếp theo"
                    disabled={!canSelectNextDay}
                    onClick={() => selectAdjacentDay(1)}
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
                <div
                  key={selectedDateKey}
                  className={`shift-day${selectedDateKey === todayKey ? " is-today" : ""}${selectedDateKey < todayKey ? " is-past" : ""}`}
                  onTouchStart={handleDayTouchStart}
                  onTouchEnd={handleDayTouchEnd}
                  aria-label={`${formatWeekday(selectedDate)} ${selectedDate.getDate()}`}
                >
                  <header className="shift-day-heading">
                    <span>
                      {selectedDateKey === todayKey
                        ? "Lịch hôm nay"
                        : selectedDateKey < todayKey
                          ? "Lịch đã qua"
                          : `Lịch ${formatWeekday(selectedDate)}`}
                    </span>
                    <span className="shift-day-weekday">
                      {formatWeekday(selectedDate)}
                    </span>
                  </header>
                  <div className="shift-day-timeline">
                    {SHIFT_OPTIONS.map((shiftOption) => {
                      const slotShifts = selectedDayShifts.filter(
                        (shift) =>
                          shift.startTime === shiftOption.startTime &&
                          shift.endTime === shiftOption.endTime,
                      );
                      const alreadyRegistered = slotShifts.some(
                        (shift) => String(shift.userId) === String(user?.id),
                      );
                      const isFull = slotShifts.length >= 2;
                      const isPastShift =
                        selectedDateKey < todayKey ||
                        (selectedDateKey === todayKey &&
                          todayTime >= shiftOption.endTime);
                      const isStartedShift =
                        selectedDateKey < todayKey ||
                        (selectedDateKey === todayKey &&
                          todayTime >= shiftOption.startTime);
                      const isWithinRegistrationWindow =
                        selectedDateKey >= todayKey &&
                        selectedDateKey <= registrationEndKey;
                      const slotKey = `${selectedDateKey}:${shiftOption.startTime}`;
                      const isEligible =
                        user && ["staff", "admin"].includes(user.role);

                      return (
                        <article
                          className={`shift-slot shift-slot-${shiftOption.tone}${isFull ? " is-full" : ""}`}
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
                                !registeredShift.isCompleted &&
                                (user?.role === "admin" ||
                                  (user?.role === "staff" &&
                                    !isStartedShift &&
                                    String(registeredShift.userId) ===
                                      String(user.id)));
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
                            <span>{slotShifts.length}/2 nhân viên</span>
                            {isEligible && (
                              <button
                                className="shift-register-button"
                                type="button"
                                disabled={
                                  loading ||
                                  !isWithinRegistrationWindow ||
                                  isPastShift ||
                                  isFull ||
                                  alreadyRegistered ||
                                  submittingSlot === slotKey
                                }
                                onClick={() =>
                                  registerShift(selectedDateKey, shiftOption)
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
                                        : !isWithinRegistrationWindow
                                          ? "Ngoài 7 ngày đăng ký"
                                          : "Đăng ký ca"}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <p className="shift-swipe-hint">
                    Vuốt sang trái hoặc phải để đổi ngày
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
        {user && ["staff", "admin"].includes(user.role) && (
          <StaffPayrollSection />
        )}
      </div>
    </section>
  );
}
