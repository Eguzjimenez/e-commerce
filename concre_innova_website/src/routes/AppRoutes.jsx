import { Routes, Route } from "react-router-dom";

import { PUBLIC_ROUTES, PRIVATE_ROUTES } from "./routes";

import Home from "../pages/Home/Home";
import Catalog from "../pages/Catalog/Catalog";
import ProductDetail from "../pages/ProductDetail/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ForgotPassword from "../pages/forgot-password/ForgotPassword";
import Chat from "../pages/Chat/Chat";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path={PUBLIC_ROUTES.HOME} element={<Home />} />
      <Route path={PUBLIC_ROUTES.CATALOG} element={<Catalog />} />
      <Route path={PUBLIC_ROUTES.PRODUCT} element={<ProductDetail />} />
      <Route path={PUBLIC_ROUTES.LOGIN} element={<Login />} />
      <Route path={PUBLIC_ROUTES.REGISTER} element={<Register />} />
      <Route path={PUBLIC_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={PUBLIC_ROUTES.CHAT} element={<Chat />} />

      {/* PRIVATE */}
      <Route path={PRIVATE_ROUTES.CART} element={<Cart />} />
      <Route path={PRIVATE_ROUTES.CHECKOUT} element={<Checkout />} />
    </Routes>
  );
}

export default AppRoutes;