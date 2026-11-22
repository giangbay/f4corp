import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import { fetchApi, useApiResource } from "./api.js";

const VIETNAM_OFFSET = "+07:00";
const STANDARD_SHIFT_MINUTES = 5 * 60;

function getVietnamDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date).replace(" ", "T");
}

function getVietnamDate(date = new Date()) {
  return getVietnamDateTime(date).slice(0, 10);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShiftDate(date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${date}T12:00:00${VIETNAM_OFFSET}`));
}

function formatAttendanceTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getShiftMinutes(shift) {
  return Number.isFinite(Number(shift.workedMinutes))
    ? Number(shift.workedMinutes)
    : 0;
}

function getShiftPay(minutes) {
  const standardMinutes = Math.min(minutes, STANDARD_SHIFT_MINUTES);
  const overtimeMinutes = Math.max(0, minutes - STANDARD_SHIFT_MINUTES);
  return Math.round((standardMinutes / 60) * 20000 + (overtimeMinutes / 60) * 30000);
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours} giờ ${remainder} phút`;
}

function getCountdown(startTimestamp, nowTimestamp) {
  const remaining = Math.max(0, startTimestamp - nowTimestamp);
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const restSeconds = seconds % 60;
  const formattedTime = [hours, minutes, restSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days} ngày ${formattedTime}` : formattedTime;
}

function getShiftState(shift, now) {
  const today = getVietnamDate(now);
  const todayTimestamp = now.getTime();
  const startTimestamp = new Date(
    `${shift.shiftDate}T${shift.startTime}:00${VIETNAM_OFFSET}`,
  ).getTime();
  const endTimestamp = new Date(
    `${shift.shiftDate}T${shift.endTime}:00${VIETNAM_OFFSET}`,
  ).getTime();
  const isToday = shift.shiftDate === today;

  if (!shift.isApproved) {
    return { label: "Chờ xác nhận lịch", detail: "Chỉ có thể chấm công sau khi quản lý xác nhận." };
  }
  if (shift.isCompleted) {
    return { label: "Đã xác nhận ngày làm", detail: "Ngày công đã được quản lý xác nhận." };
  }
  if (shift.checkOutAt) {
    return { label: "Chờ xác nhận ngày công", detail: "Đã checkout. Quản lý sẽ xác nhận ngày làm." };
  }
  if (shift.checkInAt) {
    if (isToday) {
      return {
        label: "Đang làm",
        detail: "Hãy checkout khi kết thúc ca.",
        canCheckOut: true,
      };
    }
    return {
      label: "Đã check-in",
      detail: "Ca đã qua ngày kết thúc. Vui lòng liên hệ quản lý để xử lý.",
    };
  }
  if (shift.shiftDate < today) {
    return { label: "Ca đã qua", detail: "Ca này chưa có dữ liệu chấm công." };
  }
  if (!isToday || todayTimestamp < startTimestamp) {
    return {
      label: "Chưa đến giờ",
      detail: `Check-in mở sau ${shift.startTime} · còn ${getCountdown(startTimestamp, todayTimestamp)}.`,
    };
  }
  if (todayTimestamp >= endTimestamp) {
    return { label: "Ca đã kết thúc", detail: "Không thể check-in sau khi ca kết thúc." };
  }
  return {
    label: "Đến giờ check-in",
    detail: "Bạn có thể bắt đầu ca làm.",
    canCheckIn: true,
  };
}

function AttendanceCard({
  shift,
  isAdmin,
  now,
  saving,
  onAttendance,
  onApprove,
}) {
  const state = getShiftState(shift, now);
  const workedMinutes = getShiftMinutes(shift);
  const hasPayroll = Boolean(shift.checkOutAt);
  const earned = getShiftPay(workedMinutes);
  const canShowCheckIn =
    !isAdmin &&
    !shift.checkInAt &&
    !shift.checkOutAt &&
    shift.shiftDate >= getVietnamDate(now) &&
    shift.isApproved &&
    state.label !== "Ca đã kết thúc";

  return (
    <article className="attendance-card">
      <header className="attendance-card-header">
        <div>
          <p className="attendance-card-date">{formatShiftDate(shift.shiftDate)}</p>
          <h3>{shift.startTime}–{shift.endTime}</h3>
          {isAdmin && <p className="attendance-card-staff">{shift.staffName}</p>}
        </div>
        <span className={`attendance-status${shift.isCompleted ? " is-complete" : ""}`}>
          {state.label}
        </span>
      </header>

      <p className="attendance-card-detail">{state.detail}</p>

      <div className="attendance-card-times">
        <span>Check-in <strong>{formatAttendanceTime(shift.checkInAt)}</strong></span>
        <span>Check-out <strong>{formatAttendanceTime(shift.checkOutAt)}</strong></span>
        {hasPayroll && (
          <span>
            Thời gian làm <strong>{formatDuration(workedMinutes)}</strong>
          </span>
        )}
      </div>

      {hasPayroll && (
        <p className="attendance-card-pay">
          {shift.isCompleted ? "Lương đã xác nhận" : "Lương dự kiến"}:{" "}
          <strong>{formatCurrency(earned)}</strong>
        </p>
      )}

      <footer className="attendance-card-actions">
        {isAdmin && shift.checkOutAt && !shift.isCompleted && (
          <button
            className="button"
            type="button"
            disabled={saving}
            onClick={() => onApprove(shift)}
          >
            {saving ? "Đang xác nhận…" : "Xác nhận ngày làm"}
          </button>
        )}
        {canShowCheckIn && (
          <button
            className="button"
            type="button"
            disabled={!state.canCheckIn || saving}
            onClick={() => onAttendance(shift, "check-in")}
          >
            Check-in
          </button>
        )}
        {!isAdmin && state.canCheckOut && (
          <button
            className="button"
            type="button"
            disabled={saving}
            onClick={() => onAttendance(shift, "check-out")}
          >
            Check-out
          </button>
        )}
      </footer>
    </article>
  );
}

export default function StaffPayrollSection({ isAdmin = false }) {
  const [month, setMonth] = useState(getVietnamDate().slice(0, 7));
  const [now, setNow] = useState(() => new Date());
  const [savingShiftId, setSavingShiftId] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    data: shifts,
    setData: setShifts,
    loading: shiftsLoading,
    error: shiftsError,
  } = useApiResource(`/staff-shifts?month=${month}`);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const socket = io();
    socket.on("staff-shift:attendance-updated", (updatedShift) => {
      setShifts((existing) =>
        existing.map((shift) =>
          String(shift.id) === String(updatedShift.id)
            ? { ...shift, ...updatedShift }
            : shift,
        ),
      );
    });
    socket.on("staff-shift:approval-updated", ({ id, isApproved }) => {
      setShifts((existing) =>
        existing.map((shift) =>
          String(shift.id) === String(id) ? { ...shift, isApproved } : shift,
        ),
      );
    });
    return () => {
      window.clearInterval(timer);
      socket.disconnect();
    };
  }, [setShifts]);

  const visibleShifts = [...shifts].sort((first, second) =>
    second.shiftDate.localeCompare(first.shiftDate) ||
    second.startTime.localeCompare(first.startTime),
  );
  const payrollSummary = useMemo(() => {
    if (!isAdmin) return [];
    const byStaff = new Map();
    shifts.forEach((shift) => {
      const current = byStaff.get(shift.userId) || {
        id: shift.userId,
        name: shift.staffName,
        completedShifts: 0,
        totalMinutes: 0,
        totalPay: 0,
      };
      if (shift.isCompleted) {
        const minutes = getShiftMinutes(shift);
        current.completedShifts += 1;
        current.totalMinutes += minutes;
        current.totalPay += getShiftPay(minutes);
      }
      byStaff.set(shift.userId, current);
    });
    return [...byStaff.values()].sort((first, second) =>
      first.name.localeCompare(second.name, "vi"),
    );
  }, [isAdmin, shifts]);

  const completedShifts = shifts.filter((shift) => shift.isCompleted);
  const totalMinutes = completedShifts.reduce(
    (total, shift) => total + getShiftMinutes(shift),
    0,
  );
  const totalPay = completedShifts.reduce(
    (total, shift) =>
      total + getShiftPay(getShiftMinutes(shift)),
    0,
  );

  async function handleAttendance(shift, action) {
    setActionError("");
    setSavingShiftId(String(shift.id));
    try {
      const updatedShift = await fetchApi(`/staff-shifts/${shift.id}/${action}`, {
        method: "POST",
      });
      setShifts((existing) =>
        existing.map((item) =>
          String(item.id) === String(updatedShift.id)
            ? { ...item, ...updatedShift }
            : item,
        ),
      );
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingShiftId("");
    }
  }

  async function handleApproval(shift) {
    setActionError("");
    setSavingShiftId(String(shift.id));
    try {
      const updatedShift = await fetchApi(
        `/staff-shifts/${shift.id}/completion`,
        { method: "PATCH", body: JSON.stringify({ completed: true }) },
      );
      setShifts((existing) =>
        existing.map((item) =>
          String(item.id) === String(updatedShift.id)
            ? { ...item, ...updatedShift }
            : item,
        ),
      );
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingShiftId("");
    }
  }

  return (
    <section className="staff-payroll-page">
      <header className="staff-payroll-heading">
        <div>
          <p className="eyebrow">{isAdmin ? "QUẢN LÝ NHÂN SỰ" : "CA LÀM CỦA TÔI"}</p>
          <h1>{isAdmin ? "Theo dõi chấm công" : "Chấm công theo ca"}</h1>
          <p>
            {isAdmin
              ? "Xác nhận ngày công sau khi nhân viên checkout."
              : "Đăng ký ca, chờ quản lý xác nhận lịch rồi check-in và checkout."}
          </p>
        </div>
        <Link className="button button-outline" to="/shifts">
          {isAdmin ? "Duyệt lịch ca" : "Xem lịch và đăng ký ca"}
        </Link>
      </header>

      <div className="staff-payroll-toolbar">
        <label>
          Tháng
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
      </div>

      {isAdmin && (
        <div className="payroll-summary-grid">
          <article>
            <span>Ngày công đã xác nhận</span>
            <strong>{completedShifts.length}</strong>
          </article>
          <article>
            <span>Tổng thời gian đã xác nhận</span>
            <strong>{formatDuration(totalMinutes)}</strong>
          </article>
          <article>
            <span>Tổng lương đã xác nhận</span>
            <strong>{formatCurrency(totalPay)}</strong>
          </article>
        </div>
      )}

      {isAdmin && payrollSummary.length > 0 && (
        <section className="payroll-staff-summary">
          <h2>Tổng hợp theo nhân viên</h2>
          <div className="payroll-staff-grid">
            {payrollSummary.map((staff) => (
              <article key={staff.id}>
                <strong>{staff.name}</strong>
                <span>{staff.completedShifts} ngày công</span>
                <span>{formatDuration(staff.totalMinutes)}</span>
                <b>{formatCurrency(staff.totalPay)}</b>
              </article>
            ))}
          </div>
        </section>
      )}

      {(shiftsError || actionError) && (
        <div className="form-message form-message-error" role="alert">
          {actionError || shiftsError}
        </div>
      )}

      <section className="attendance-list">
        <div className="attendance-list-heading">
          <div>
            <h2>{isAdmin ? "Các ca đã đăng ký" : "Ca làm của tôi"}</h2>
            <p>
              {isAdmin
                ? "Những ca đã checkout cần quản lý xác nhận."
                : "Nút check-in chỉ mở đúng ngày và sau giờ bắt đầu ca."}
            </p>
          </div>
        </div>
        {shiftsLoading && (
          <p className="page-loading">Đang tải dữ liệu chấm công…</p>
        )}
        {!shiftsLoading && visibleShifts.length === 0 && (
          <p className="empty-state">Không có ca làm trong tháng này.</p>
        )}
        <div className="attendance-card-list">
          {visibleShifts.map((shift) => (
            <AttendanceCard
              key={shift.id}
              shift={shift}
              isAdmin={isAdmin}
              now={now}
              saving={savingShiftId === String(shift.id)}
              onAttendance={handleAttendance}
              onApprove={handleApproval}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
