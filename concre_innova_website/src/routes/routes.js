export const PUBLIC_ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  PRODUCT: "/product",
  PRODUCT_DETAIL: "/product/:idProducto",
  FAVORITES: "/favorites",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password"
};

export function buildProductDetailRoute(idProducto) {
  return `${PUBLIC_ROUTES.PRODUCT}/${idProducto}`;
}

export const PRIVATE_ROUTES = {
  CART: "/cart",
  CHECKOUT: "/checkout",
  MY_ORDERS: "/mis-pedidos",
  MY_ACCOUNT: "/mi-cuenta"
};

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin",
  INVENTORY: "/admin/inventory",
  PRODUCTS: "/admin/products",
  CATEGORIES: "/admin/categories",
  PRODUCT_TYPES: "/admin/product-types",
  QUOTATIONS: "/admin/quotations",
  ORDERS: "/admin/orders",
  CHAT: "/admin/chat",
  REPORTS: "/admin/reports",
  STATISTICS: "/admin/statistics",
  USERS: "/admin/users",
  BITACORA: "/admin/bitacora",
  PERMISSIONS: "/admin/permissions"
};

