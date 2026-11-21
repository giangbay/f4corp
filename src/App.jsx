import { Route, Routes } from "react-router-dom";
import AdminPage from "./AdminPage.jsx";
import ChatPage from "./ChatPage.jsx";
import LoginPage from "./LoginPage.jsx";
import OrdersPage from "./OrdersPage.jsx";
import StaffSchedulePage from "./StaffSchedulePage.jsx";
import ScrollProgress from "./components/ScrollProgress.jsx";
import ScrollToLocation from "./components/ScrollToLocation.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import HomePage from "./sections/HomePage.jsx";
import MenuItemPage from "./sections/MenuItemPage.jsx";
import MenuPage from "./sections/MenuPage.jsx";
import NotFoundPage from "./sections/NotFoundPage.jsx";
import StoryPage from "./sections/StoryPage.jsx";
import SpacePage from "./sections/SpacePage.jsx";
import VisitPage from "./sections/VisitPage.jsx";

export default function App() {
  return (
    <>
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
          <Route path="/visit" element={<VisitPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/shifts" element={<StaffSchedulePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}
