import { ROLES } from "./constants/roles";
import { ROLE_GROUPS, isAdminRole, isVendorRole } from "./constants/roleAccess";

test("defines administrative access only for administrator role", () => {
  expect(isAdminRole(ROLES.ADMINISTRADOR)).toBe(true);
  expect(isAdminRole(ROLES.VENDEDOR)).toBe(false);
  expect(isAdminRole(ROLES.CLIENTE)).toBe(false);
  expect(isVendorRole(ROLES.VENDEDOR)).toBe(true);
  expect(ROLE_GROUPS.ADMIN_ONLY).toEqual([ROLES.ADMINISTRADOR]);
});
