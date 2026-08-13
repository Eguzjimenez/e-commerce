export const PUBLIC_ROUTES = {
  HOME: "/",
  CATALOG: "/catalog",
  PRODUCT: "/product",
  PRODUCT_DETAIL: "/product/:idProducto",
  FAVORITES: "/favorites",
  SMART_ADVISOR: "/asesor-inteligente",
  CONTACT: "/contacto",
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
  NEW_QUOTATION: "/cotizaciones/nueva",
  MY_QUOTATIONS: "/mis-cotizaciones",
  MY_ACCOUNT: "/mi-cuenta",
  NOTIFICATIONS: "/notificaciones",
  SETTINGS: "/configuracion"
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
  CONSULTAS: "/admin/consultas",
  REPORTS: "/admin/reports",
  COMPANY_INFO: "/admin/company-info",
  USERS: "/admin/users",
  BITACORA: "/admin/bitacora",
  PERMISSIONS: "/admin/permissions"
};

