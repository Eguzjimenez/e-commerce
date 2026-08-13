import { ADMIN_ROUTES, PRIVATE_ROUTES } from "../routes/routes";
import { ROLE_GROUPS } from "./roleAccess";

export const ADMIN_NAV_ITEMS = [
  {
    to: ADMIN_ROUTES.DASHBOARD,
    label: "Panel principal",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.INVENTORY,
    label: "Inventario",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.PRODUCTS,
    label: "Productos",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
  {
    to: ADMIN_ROUTES.CATEGORIES,
    label: "Categorias",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
  {
    to: ADMIN_ROUTES.PRODUCT_TYPES,
    label: "Tipos de producto",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.QUOTATIONS,
    label: "Cotizaciones",
    roles: ROLE_GROUPS.QUOTATION_STAFF,
  },
  {
    to: ADMIN_ROUTES.ORDERS,
    label: "Pedidos",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.CHAT,
    label: "Chat administrativo",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
  {
    to: ADMIN_ROUTES.CONSULTAS,
    label: "Consultas",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
  {
    to: ADMIN_ROUTES.USERS,
    label: "Usuarios",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.PERMISSIONS,
    label: "Permisos",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.REPORTS,
    label: "Reportes",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.COMPANY_INFO,
    label: "Informacion de empresa",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.BITACORA,
    label: "Bitacora",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: PRIVATE_ROUTES.NOTIFICATIONS,
    label: "Notificaciones",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
  {
    to: PRIVATE_ROUTES.SETTINGS,
    label: "Configuracion",
    roles: ROLE_GROUPS.SALES_MANAGEMENT,
  },
];

export function getAdminPanelName(role) {
  return role === "Vendedor" ? "Panel de Ventas" : "Panel de Administracion";
}
