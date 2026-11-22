import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

const REGULAR_HOURLY_RATE = 20_000;
const OVERTIME_HOURLY_RATE = 30_000;
const REGULAR_SHIFT_MINUTES = 5 * 60;
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

function getVietnamParts(date, options) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: VIETNAM_TIME_ZONE,
      ...options,
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
}

function currentMonth() {
  const parts = getVietnamParts(new Date(), {
    year: "numeric",
    month: "2-digit",
  });
  return `${parts.year}-${parts.month}`;
}

function currentDate() {
  const parts = getVietnamParts(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatCurrency(amount) {
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

function formatHours(minutes) {
  return `${(minutes / 60).toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  })} giờ`;
}

function formatShiftDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAttendanceTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const parts = getVietnamParts(new Date(value), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function localDateTimeToIso(value) {
  return new Date(`${value}:00+07:00`).toISOString();
}

function currentVietnamDateTime() {
  const parts = getVietnamParts(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function hasShiftEnded(shift) {
  return `${shift.shiftDate}T${shift.endTime}` <= currentVietnamDateTime();
}

function getWorkedMinutes(shift) {
  if (shift.workedMinutes === null || shift.workedMinutes === undefined) return null;
  return Math.max(0, Number(shift.workedMinutes) || 0);
}

function getShiftPay(shift) {
  const workedMinutes = getWorkedMinutes(shift) ?? 0;
  const regularMinutes = Math.min(workedMinutes, REGULAR_SHIFT_MINUTES);
  const overtimeMinutes = Math.max(workedMinutes - REGULAR_SHIFT_MINUTES, 0);
  return (
    (regularMinutes / 60) * REGULAR_HOURLY_RATE +
    (overtimeMinutes / 60) * OVERTIME_HOURLY_RATE
  );
}

export default function StaffPayrollSection() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [month, setMonth] = useState(currentMonth);
  const [shifts, setShifts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [attendanceDrafts, setAttendanceDrafts] = useState({});
  const [savingShiftId, setSavingShiftId] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const requests = [
      fetchApi(`/staff-shifts?month=${encodeURIComponent(month)}`),
    ];
    if (isAdmin) requests.push(fetchApi("/admin/users"));

    Promise.all(requests)
      .then(([monthShifts, users = []]) => {
        if (!active) return;
        setShifts(monthShifts);
        setAccounts(
          users.filter((account) =>
            ["staff", "admin"].includes(account.role),
          ),
        );
        setAttendanceDrafts(
          Object.fromEntries(
            monthShifts.map((shift) => [
              shift.id,
              {
                checkInAt: toLocalDateTimeInput(shift.checkInAt),
                checkOutAt: toLocalDateTimeInput(shift.checkOutAt),
              },
            ]),
          ),
        );
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, month]);

  const completedShifts = shifts.filter(
    (shift) => Boolean(shift.isCompleted) && getWorkedMinutes(shift) !== null,
  );
  const checkedOutShifts = shifts.filter(
    (shift) => getWorkedMinutes(shift) !== null,
  );
  const recordedMinutes = checkedOutShifts.reduce(
    (total, shift) => total + getWorkedMinutes(shift),
    0,
  );
  const approvedMinutes = completedShifts.reduce(
    (total, shift) => total + getWorkedMinutes(shift),
    0,
  );
  const totalSalary = completedShifts.reduce(
    (total, shift) => total + getShiftPay(shift),
    0,
  );
  const payrollRows = useMemo(() => {
    const byUser = new Map(
      accounts.map((account) => [
        String(account.id),
        {
          ...account,
          checkedOut: 0,
          workedMinutes: 0,
          approvedMinutes: 0,
          salary: 0,
        },
      ]),
    );
    for (const shift of shifts) {
      const row = byUser.get(String(shift.userId));
      if (!row) continue;
      const minutes = getWorkedMinutes(shift);
      if (minutes === null) continue;
      row.checkedOut += 1;
      row.workedMinutes += minutes;
      if (shift.isCompleted) {
        row.approvedMinutes += minutes;
        row.salary += getShiftPay(shift);
      }
    }
    return [...byUser.values()].sort((first, second) =>
      first.name.localeCompare(second.name, "vi"),
    );
  }, [accounts, shifts]);

  function updateShift(shiftId, patch) {
    setShifts((existing) =>
      existing.map((shift) =>
        String(shift.id) === String(shiftId) ? { ...shift, ...patch } : shift,
      ),
    );
  }

  async function recordAttendance(shift, action) {
    setActionError("");
    setSavingShiftId(String(shift.id));
    try {
      const result = await fetchApi(
        `/staff-shifts/${shift.id}/${action}`,
        { method: "POST" },
      );
      updateShift(shift.id, result);
      setAttendanceDrafts((existing) => ({
        ...existing,
        [shift.id]: {
          checkInAt: toLocalDateTimeInput(result.checkInAt),
          checkOutAt: toLocalDateTimeInput(result.checkOutAt),
        },
      }));
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingShiftId("");
    }
  }

  async function correctAttendance(shift) {
    const draft = attendanceDrafts[shift.id] ?? {};
    if (Boolean(draft.checkInAt) !== Boolean(draft.checkOutAt)) {
      setActionError("Cần nhập cả giờ check-in và check-out, hoặc xóa cả hai.");
      return;
    }
    setActionError("");
    setSavingShiftId(String(shift.id));
    try {
      const result = await fetchApi(`/staff-shifts/${shift.id}/attendance`, {
        method: "PATCH",
        body: JSON.stringify({
          checkInAt: draft.checkInAt ? localDateTimeToIso(draft.checkInAt) : null,
          checkOutAt: draft.checkOutAt ? localDateTimeToIso(draft.checkOutAt) : null,
        }),
      });
      updateShift(shift.id, result);
      setAttendanceDrafts((existing) => ({
        ...existing,
        [shift.id]: {
          checkInAt: toLocalDateTimeInput(result.checkInAt),
          checkOutAt: toLocalDateTimeInput(result.checkOutAt),
        },
      }));
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingShiftId("");
    }
  }

  async function updateCompletion(shift, completed) {
    setActionError("");
    setSavingShiftId(String(shift.id));
    try {
      const result = await fetchApi(`/staff-shifts/${shift.id}/completion`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      updateShift(shift.id, result);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingShiftId("");
    }
  }

  return (
    <section className="staff-payroll" aria-labelledby="staff-payroll-heading">
      <header className="staff-payroll-heading">
        <div>
          <span className="eyebrow">{isAdmin ? "Theo dõi nhân sự" : "Công của bạn"}</span>
          <h2 id="staff-payroll-heading">
            {isAdmin ? "Bảng công và tính lương" : "Lịch đã làm trong tháng"}
          </h2>
          <p>
            Check-in/out tính giờ thực tế, không trừ giờ nghỉ · 20.000đ/giờ thường ·
            30.000đ/giờ ngoài giờ sau 5 tiếng/ca
          </p>
        </div>
        <label className="staff-payroll-month">
          <span>Tháng</span>
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
      </header>

      {loading && <p className="resource-message">Đang tải bảng công…</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}
      {actionError && (
        <p className="form-message form-message-error" role="alert">{actionError}</p>
      )}
      {!loading && !error && (
        <>
          <div className="staff-payroll-totals">
            <article>
              <span>Ca đã check-out</span>
              <strong>{checkedOutShifts.length}</strong>
            </article>
            <article>
              <span>Tổng giờ ghi nhận</span>
              <strong>{formatHours(recordedMinutes)}</strong>
            </article>
            <article>
              <span>Giờ đã duyệt</span>
              <strong>{formatHours(approvedMinutes)}</strong>
            </article>
            <article>
              <span>Lương đã duyệt</span>
              <strong>{formatCurrency(totalSalary)}</strong>
            </article>
          </div>

          {isAdmin && (
            <div className="staff-payroll-table-wrap">
              <table className="staff-payroll-table">
                <caption>Tổng hợp chấm công và lương theo nhân sự trong tháng</caption>
                <thead>
                  <tr>
                    <th>Nhân sự</th>
                    <th>Ca đã check-out</th>
                    <th>Tổng giờ</th>
                    <th>Giờ đã duyệt</th>
                    <th>Lương đã duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.name}
                        {row.role === "admin" && (
                          <span className="staff-payroll-role">Quản trị viên</span>
                        )}
                      </td>
                      <td>{row.checkedOut}</td>
                      <td>{formatHours(row.workedMinutes)}</td>
                      <td>{formatHours(row.approvedMinutes)}</td>
                      <td>{formatCurrency(row.salary)}</td>
                    </tr>
                  ))}
                  {payrollRows.length === 0 && (
                    <tr><td colSpan="5">Chưa có tài khoản nhân viên.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="staff-payroll-table-wrap">
            <table className="staff-payroll-table">
              <caption>
                {isAdmin ? "Chi tiết chấm công theo ca" : "Các ca của bạn trong tháng"}
              </caption>
              <thead>
                <tr>
                  {isAdmin && <th>Nhân sự</th>}
                  <th>Ngày</th>
                  <th>Ca</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Giờ thực tế</th>
                  <th>Trạng thái</th>
                  <th>Lương ca</th>
                  <th>{isAdmin ? "Thao tác" : "Chấm công"}</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const ownShift = String(shift.userId) === String(user?.id);
                  const isToday = shift.shiftDate === currentDate();
                  const canCheckIn =
                    ownShift &&
                    isToday &&
                    !shift.checkInAt &&
                    `${shift.shiftDate}T${shift.startTime}` <=
                      currentVietnamDateTime() &&
                    !hasShiftEnded(shift);
                  const canCheckOut =
                    ownShift &&
                    isToday &&
                    Boolean(shift.checkInAt) &&
                    !shift.checkOutAt;
                  const saving = savingShiftId === String(shift.id);
                  const workedMinutes = getWorkedMinutes(shift);
                  const draft = attendanceDrafts[shift.id] ?? {
                    checkInAt: "",
                    checkOutAt: "",
                  };

                  return (
                    <tr key={shift.id}>
                      {isAdmin && (
                        <td>
                          {shift.staffName}
                          {shift.staffRole === "admin" && (
                            <span className="staff-payroll-role">Quản trị viên</span>
                          )}
                        </td>
                      )}
                      <td>{formatShiftDate(shift.shiftDate)}</td>
                      <td>{shift.startTime}–{shift.endTime}</td>
                      <td>
                        {isAdmin ? (
                          <input
                            className="staff-attendance-time"
                            type="datetime-local"
                            aria-label={`Sửa check-in ${shift.staffName}, ${shift.shiftDate}`}
                            value={draft.checkInAt}
                            onChange={(event) =>
                              setAttendanceDrafts((existing) => ({
                                ...existing,
                                [shift.id]: {
                                  ...draft,
                                  checkInAt: event.target.value,
                                },
                              }))
                            }
                          />
                        ) : (
                          formatAttendanceTime(shift.checkInAt)
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <input
                            className="staff-attendance-time"
                            type="datetime-local"
                            aria-label={`Sửa check-out ${shift.staffName}, ${shift.shiftDate}`}
                            value={draft.checkOutAt}
                            onChange={(event) =>
                              setAttendanceDrafts((existing) => ({
                                ...existing,
                                [shift.id]: {
                                  ...draft,
                                  checkOutAt: event.target.value,
                                },
                              }))
                            }
                          />
                        ) : (
                          formatAttendanceTime(shift.checkOutAt)
                        )}
                      </td>
                      <td>{workedMinutes === null ? "—" : formatHours(workedMinutes)}</td>
                      <td>
                        <span
                          className={`staff-payroll-status${shift.isCompleted ? " is-completed" : ""}`}
                        >
                          {shift.isCompleted
                            ? "Đã duyệt"
                            : shift.checkOutAt
                              ? "Chờ duyệt"
                              : shift.checkInAt
                                ? "Đang làm"
                                : "Chưa check-in"}
                        </span>
                      </td>
                      <td>
                        {shift.isCompleted && workedMinutes !== null
                          ? formatCurrency(getShiftPay(shift))
                          : "—"}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="staff-attendance-actions">
                            {canCheckIn && (
                              <button
                                className="staff-payroll-action"
                                type="button"
                                disabled={saving}
                                onClick={() => recordAttendance(shift, "check-in")}
                              >
                                {saving ? "Đang lưu…" : "Check-in"}
                              </button>
                            )}
                            {canCheckOut && (
                              <button
                                className="staff-payroll-action"
                                type="button"
                                disabled={saving}
                                onClick={() => recordAttendance(shift, "check-out")}
                              >
                                {saving ? "Đang lưu…" : "Check-out"}
                              </button>
                            )}
                            <button
                              className="staff-payroll-action is-secondary"
                              type="button"
                              disabled={saving}
                              onClick={() => correctAttendance(shift)}
                            >
                              Lưu giờ
                            </button>
                            {shift.isCompleted ? (
                              <button
                                className="staff-payroll-action is-secondary"
                                type="button"
                                disabled={saving}
                                onClick={() => updateCompletion(shift, false)}
                              >
                                Bỏ duyệt
                              </button>
                            ) : (
                              <button
                                className="staff-payroll-action"
                                type="button"
                                disabled={
                                  !shift.checkInAt ||
                                  !shift.checkOutAt ||
                                  !hasShiftEnded(shift) ||
                                  saving
                                }
                                title={
                                  !hasShiftEnded(shift)
                                    ? "Chỉ duyệt sau khi ca kết thúc"
                                    : ""
                                }
                                onClick={() => updateCompletion(shift, true)}
                              >
                                Duyệt công
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                      {!isAdmin && (
                        <td>
                          <div className="staff-attendance-actions">
                            {canCheckIn && (
                              <button
                                className="staff-payroll-action"
                                type="button"
                                disabled={saving}
                                onClick={() => recordAttendance(shift, "check-in")}
                              >
                                {saving ? "Đang lưu…" : "Check-in"}
                              </button>
                            )}
                            {canCheckOut && (
                              <button
                                className="staff-payroll-action"
                                type="button"
                                disabled={saving}
                                onClick={() => recordAttendance(shift, "check-out")}
                              >
                                {saving ? "Đang lưu…" : "Check-out"}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8}>
                      Tháng này chưa có ca đăng ký.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="staff-payroll-note">
            Tổng giờ được tính từ check-in đến check-out, không tự trừ giờ nghỉ.
            Giờ công được duyệt mới tính lương: tối đa 5 giờ/ca theo mức 20.000đ/giờ,
            phần vượt 5 giờ tính 30.000đ/giờ. Nhân viên chỉ chấm công cho ca của
            mình trong đúng ngày làm; quản trị viên có thể sửa giờ và duyệt công.
          </p>
        </>
      )}
    </section>
  );
}
