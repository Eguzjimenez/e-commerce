import { Navigate, Routes, Route } from "react-router-dom";

import { PUBLIC_ROUTES, PRIVATE_ROUTES, ADMIN_ROUTES } from "./routes";
import { ROLE_GROUPS } from "../constants/roleAccess";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

import Home from "../pages/Home/Home";
import Catalog from "../pages/Catalog/Catalog";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Favorites from "../pages/Favorites/Favorites";
import SmartAdvisor from "../pages/SmartAdvisor/SmartAdvisor";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import History from "../pages/History/History";
import QuotationRequest from "../pages/QuotationRequest/QuotationRequest";
import QuotationHistory from "../pages/QuotationHistory/QuotationHistory";
import MyAccount from "../pages/MyAccount/MyAccount";
import Contact from "../pages/Contact/Contact";
import Notifications from "../pages/Notifications/Notifications";
import Settings from "../pages/Settings/Settings";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/forgot-password/ForgotPassword";
import AccessDenied from "../pages/AccessDenied/AccessDenied";
import { ROLES } from "../constants/roles";

import AdminDashboard from "../pages/AdminDashboard/AdminDashboard";
import AdminInventory from "../pages/AdminInventory/AdminInventory";
import AdminProducts from "../pages/AdminProducts/AdminProducts";
import AdminCategories from "../pages/AdminCategories/AdminCategories";
import AdminProductTypes from "../pages/AdminProductTypes/AdminProductTypes";
import AdminQuotations from "../pages/AdminQuotations/AdminQuotations";
import AdminOrders from "../pages/AdminOrders/AdminOrders";
import AdminChat from "../pages/AdminChat/AdminChat";
import AdminConsultas from "../pages/AdminConsultas/AdminConsultas";
import AdminReports from "../pages/AdminReports/AdminReports";
import AdminCompanyInfo from "../pages/AdminCompanyInfo/AdminCompanyInfo";
import AdminUsers from "../pages/AdminUsers/AdminUsers";
import AdminBitacora from "../pages/AdminBitacora/AdminBitacora";
import AdminPermissions from "../pages/AdminPermissions/AdminPermissions";

function AppRoutes() {
  return (
    <Routes>
      <Route path={PUBLIC_ROUTES.HOME} element={<Home />} />
        <Route path={PUBLIC_ROUTES.CATALOG} element={<Catalog />} />
        <Route path={PUBLIC_ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
        <Route path={PUBLIC_ROUTES.PRODUCT} element={<ProductDetail />} />
        <Route path={PUBLIC_ROUTES.FAVORITES} element={<Favorites />} />
        <Route path={PUBLIC_ROUTES.SMART_ADVISOR} element={<SmartAdvisor />} />
        <Route path={PUBLIC_ROUTES.CONTACT} element={<Contact />} />

        <Route path={PRIVATE_ROUTES.CART} element={<Cart />} />
        <Route
          path={PRIVATE_ROUTES.CHECKOUT}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.PURCHASE}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.MY_ORDERS}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.PURCHASE}>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.NEW_QUOTATION}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.PURCHASE}>
              <QuotationRequest />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.MY_QUOTATIONS}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.PURCHASE}>
              <QuotationHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.MY_ACCOUNT}
          element={
            <ProtectedRoute allowedRoles={[ROLES.CLIENTE]}>
              <MyAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.AUTHENTICATED}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path={PRIVATE_ROUTES.SETTINGS}
          element={
            <ProtectedRoute allowedRoles={ROLE_GROUPS.AUTHENTICATED}>
              <Settings />
            </ProtectedRoute>
          }
        />
      <Route path={PUBLIC_ROUTES.LOGIN} element={<Login />} />
      <Route path={PUBLIC_ROUTES.REGISTER} element={<Register />} />
      <Route path={PUBLIC_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path="/acceso-denegado" element={<AccessDenied />} />

      <Route
        path={ADMIN_ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.USERS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CATEGORIES}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.SALES_MANAGEMENT}>
            <AdminCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CONSULTAS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.SALES_MANAGEMENT}>
            <AdminConsultas />
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
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.COMPANY_INFO}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminCompanyInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.BITACORA}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminBitacora />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PERMISSIONS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminPermissions />
          </ProtectedRoute>
        }
      />

      <Route
        path={ADMIN_ROUTES.INVENTORY}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminInventory />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.PRODUCTS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.SALES_MANAGEMENT}>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.QUOTATIONS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.QUOTATION_STAFF}>
            <AdminQuotations />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.ORDERS}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path={ADMIN_ROUTES.CHAT}
        element={
          <ProtectedRoute allowedRoles={ROLE_GROUPS.SALES_MANAGEMENT}>
            <AdminChat />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={PUBLIC_ROUTES.HOME} replace />} />
    </Routes>
  );
}

export default AppRoutes;
