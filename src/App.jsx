import { Route, Routes } from "react-router-dom";
import AdminMenuSection from "./AdminMenuSection.jsx";
import OrderManagementSection from "./OrderManagementSection.jsx";
import AdminAccountsPage from "./AdminAccountsPage.jsx";
import AdminDashboardPage from "./AdminDashboardPage.jsx";
import AdminRevenuePage from "./AdminRevenuePage.jsx";
import AdminStaffPage from "./AdminStaffPage.jsx";
import AdminPage from "./AdminPage.jsx";
import ChatPage from "./ChatPage.jsx";
import LoginPage from "./LoginPage.jsx";
import OrdersPage from "./OrdersPage.jsx";
import StaffPayrollPage from "./StaffPayrollPage.jsx";
import StaffSchedulePage from "./StaffSchedulePage.jsx";
import ScrollProgress from "./components/ScrollProgress.jsx";
import ScrollToLocation from "./components/ScrollToLocation.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import { OrderProvider } from "./OrderContext.jsx";
import BlogPage from "./sections/BlogPage.jsx";
import HomePage from "./sections/HomePage.jsx";
import MenuItemPage from "./sections/MenuItemPage.jsx";
import MenuPage from "./sections/MenuPage.jsx";
import NotFoundPage from "./sections/NotFoundPage.jsx";
import StoryPage from "./sections/StoryPage.jsx";
import SpacePage from "./sections/SpacePage.jsx";
import VisitPage from "./sections/VisitPage.jsx";

export default function App() {
  return (
    <OrderProvider>
      <ScrollProgress />
      <ScrollToLocation />
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/space" element={<SpacePage />} />
          <Route path="/menu/:slug" element={<MenuItemPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:blogId" element={<BlogPage />} />
          <Route path="/visit" element={<VisitPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/shifts" element={<StaffSchedulePage />} />
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="revenue" element={<AdminRevenuePage />} />
            <Route path="payroll" element={<StaffPayrollPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
          </Route>
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/payroll" element={<StaffPayrollPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </OrderProvider>
  );
}

function AdminMenuPage() {
  return <AdminMenuSection />;
}

function AdminOrdersPage() {
  return <OrderManagementSection />;
}
