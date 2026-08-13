import { ROLES } from "./roles";

export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLES.ADMINISTRADOR],
  SALES_MANAGEMENT: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  AUTHENTICATED: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR, ROLES.CLIENTE],
  PURCHASE: [ROLES.ADMINISTRADOR, ROLES.CLIENTE],
  QUOTATION_STAFF: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
};

export function isAdminRole(role) {
  return role === ROLES.ADMINISTRADOR;
}

export function isVendorRole(role) {
  return role === ROLES.VENDEDOR;
}

/**
 * Roles que operan el panel interno. El vendedor no es administrador, pero
 * navega con la misma estructura de personal y no con la de cliente.
 */
export function isStaffRole(role) {
  return ROLE_GROUPS.SALES_MANAGEMENT.includes(role);
}

export function canManageCatalog(role) {
  return ROLE_GROUPS.SALES_MANAGEMENT.includes(role);
}

export function canPurchase(role) {
  return ROLE_GROUPS.PURCHASE.includes(role);
}

export function canManageQuotations(role) {
  return ROLE_GROUPS.QUOTATION_STAFF.includes(role);
}
