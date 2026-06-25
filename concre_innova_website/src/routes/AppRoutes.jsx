import { Routes, Route } from "react-router-dom";

import { PUBLIC_ROUTES, PRIVATE_ROUTES, ADMIN_ROUTES } from "./routes";
import { ROLES } from "../constants/roles";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

import Home from "../pages/Home/Home";
import Catalog from "../pages/Catalog/Catalog";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/forgot-password/ForgotPassword";
import Chat from "../pages/Chat/Chat";
import AccessDenied from "../pages/AccessDenied/AccessDenied";

import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import AdminInventory from "../pages/AdminInventory/AdminInventory";
import AdminProducts from "../pages/AdminProducts/AdminProducts";
import AdminCategories from "../pages/AdminCategories/AdminCategories";
import AdminProductTypes from "../pages/AdminProductTypes/AdminProductTypes";
import AdminQuotations from "../pages/AdminQuotations/AdminQuotations";
import AdminOrders from "../pages/AdminOrders/AdminOrders";
import AdminChat from "../pages/AdminChat/AdminChat";
import AdminReports from "../pages/AdminReports/AdminReports";
import AdminStatistics from "../pages/AdminStatistics/AdminStatistics";
import AdminUsers from "../pages/AdminUsers/AdminUsers";
import AdminBitacora from "../pages/AdminBitacora/AdminBitacora";

const SOLO_ADMIN = [ROLES.ADMINISTRADOR];
const ADMIN_Y_VENDEDOR = [ROLES.ADMINISTRADOR, ROLES.VENDEDOR];
const TODOS_AUTENTICADOS = [ROLES.ADMINISTRADOR, ROLES.VENDEDOR, ROLES.CLIENTE];

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
      <Route path="/acceso-denegado" element={<AccessDenied />} />

      <Route path={PRIVATE_ROUTES.CART} element={<Cart />} />
      <Route
        path={PRIVATE_ROUTES.CHECKOUT}
        element={
          <ProtectedRoute allowedRoles={TODOS_AUTENTICADOS}>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.USERS}
        element={
          <ProtectedRoute allowedRoles={SOLO_ADMIN}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CATEGORIES}
        element={
          <ProtectedRoute allowedRoles={SOLO_ADMIN}>
            <AdminCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PRODUCT_TYPES}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminProductTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.REPORTS}
        element={
          <ProtectedRoute allowedRoles={SOLO_ADMIN}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.STATISTICS}
        element={
          <ProtectedRoute allowedRoles={SOLO_ADMIN}>
            <AdminStatistics />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.BITACORA}
        element={
          <ProtectedRoute allowedRoles={SOLO_ADMIN}>
            <AdminBitacora />
          </ProtectedRoute>
        }
      />

      <Route
        path={ADMIN_ROUTES.INVENTORY}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminInventory />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PRODUCTS}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.QUOTATIONS}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminQuotations />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.ORDERS}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CHAT}
        element={
          <ProtectedRoute allowedRoles={ADMIN_Y_VENDEDOR}>
            <AdminChat />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
