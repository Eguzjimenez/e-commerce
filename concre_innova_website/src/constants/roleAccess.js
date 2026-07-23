import { ROLES } from "./roles";

export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLES.ADMINISTRADOR],
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

export function canPurchase(role) {
  return ROLE_GROUPS.PURCHASE.includes(role);
}

export function canManageQuotations(role) {
  return ROLE_GROUPS.QUOTATION_STAFF.includes(role);
}
