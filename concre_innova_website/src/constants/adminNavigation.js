import { ADMIN_ROUTES } from "../routes/routes";
import { ROLES } from "./roles";
import { ROLE_GROUPS } from "./roleAccess";

export const ADMIN_NAV_ITEMS = [
  {
    to: ADMIN_ROUTES.DASHBOARD,
    label: "Panel principal",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.INVENTORY,
    label: "Inventario",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.PRODUCTS,
    label: "Productos",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.CATEGORIES,
    label: "Categorias",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.QUOTATIONS,
    label: "Cotizaciones",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.ORDERS,
    label: "Pedidos",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.CHAT,
    label: "Chat administrativo",
    roles: ROLE_GROUPS.STAFF,
  },
  {
    to: ADMIN_ROUTES.USERS,
    label: "Usuarios",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.REPORTS,
    label: "Reportes",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.STATISTICS,
    label: "Estadisticas",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
  {
    to: ADMIN_ROUTES.BITACORA,
    label: "Bitacora",
    roles: ROLE_GROUPS.ADMIN_ONLY,
  },
];

export function getAdminPanelName(role) {
  return role === ROLES.VENDEDOR ? "Panel de Ventas" : "Panel de Administracion";
}
