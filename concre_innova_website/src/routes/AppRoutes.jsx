import { Routes, Route } from "react-router-dom";

import { PUBLIC_ROUTES, PRIVATE_ROUTES, ADMIN_ROUTES } from "./routes";

import Home from "../pages/Home/Home";
import Catalog from "../pages/Catalog/Catalog";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/forgot-password/ForgotPassword";
import Chat from "../pages/Chat/Chat";

import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import AdminInventory from "../pages/AdminInventory/AdminInventory";
import AdminProducts from "../pages/AdminProducts/AdminProducts";
import AdminCategories from "../pages/AdminCategories/AdminCategories";
import AdminQuotations from "../pages/AdminQuotations/AdminQuotations";
import AdminOrders from "../pages/AdminOrders/AdminOrders";
import AdminChat from "../pages/AdminChat/AdminChat";
import AdminReports from "../pages/AdminReports/AdminReports";
import AdminStatistics from "../pages/AdminStatistics/AdminStatistics";
import AdminUsers from "../pages/AdminUsers/AdminUsers";

function AppRoutes() {
  return (
    <Routes>
      <Route path={PUBLIC_ROUTES.HOME} element={<Home />} />
      <Route path={PUBLIC_ROUTES.CATALOG} element={<Catalog />} />
      <Route path={PUBLIC_ROUTES.PRODUCT} element={<ProductDetail />} />
      <Route path={PUBLIC_ROUTES.LOGIN} element={<Login />} />
      <Route path={PUBLIC_ROUTES.REGISTER} element={<Register />} />
      <Route path={PUBLIC_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={PUBLIC_ROUTES.CHAT} element={<Chat />} />

      <Route path={PRIVATE_ROUTES.CART} element={<Cart />} />
      <Route path={PRIVATE_ROUTES.CHECKOUT} element={<Checkout />} />

      <Route path={ADMIN_ROUTES.DASHBOARD} element={<AdminDashboard />} />
      <Route path={ADMIN_ROUTES.INVENTORY} element={<AdminInventory />} />
      <Route path={ADMIN_ROUTES.PRODUCTS} element={<AdminProducts />} />
      <Route path={ADMIN_ROUTES.CATEGORIES} element={<AdminCategories />} />
      <Route path={ADMIN_ROUTES.QUOTATIONS} element={<AdminQuotations />} />
      <Route path={ADMIN_ROUTES.ORDERS} element={<AdminOrders />} />
      <Route path={ADMIN_ROUTES.CHAT} element={<AdminChat />} />
      <Route path={ADMIN_ROUTES.REPORTS} element={<AdminReports />} />
      <Route path={ADMIN_ROUTES.STATISTICS} element={<AdminStatistics />} />
      <Route path={ADMIN_ROUTES.USERS} element={<AdminUsers />} />
    </Routes>
  );
}

export default AppRoutes;