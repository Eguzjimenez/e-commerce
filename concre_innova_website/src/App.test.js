import { ROLES } from "./constants/roles";
import { ROLE_GROUPS, isStaffRole } from "./constants/roleAccess";

test("defines staff access for administrator and vendor roles", () => {
  expect(isStaffRole(ROLES.ADMINISTRADOR)).toBe(true);
  expect(isStaffRole(ROLES.VENDEDOR)).toBe(true);
  expect(isStaffRole(ROLES.CLIENTE)).toBe(false);
  expect(ROLE_GROUPS.STAFF).toEqual([ROLES.ADMINISTRADOR, ROLES.VENDEDOR]);
});
