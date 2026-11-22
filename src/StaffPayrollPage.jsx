import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import StaffPayrollSection from "./StaffPayrollSection.jsx";

export default function StaffPayrollPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <section className="admin-page container"><p>Đang xác minh phiên đăng nhập…</p></section>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: "/payroll" }} />;
  if (!["staff", "admin"].includes(user.role)) return <Navigate to="/chat" replace />;

  if (user.role === "admin") return <StaffPayrollSection />;

  return (
    <section className="admin-page">
      <div className="container">
        <StaffPayrollSection />
      </div>
    </section>
  );
}
