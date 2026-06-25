import { ROLES } from "./roles";

export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLES.ADMINISTRADOR],
  STAFF: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  AUTHENTICATED: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR, ROLES.CLIENTE],
};

export function isAdminRole(role) {
  return role === ROLES.ADMINISTRADOR;
}

export function isVendorRole(role) {
  return role === ROLES.VENDEDOR;
}

export function isStaffRole(role) {
  return ROLE_GROUPS.STAFF.includes(role);
}
