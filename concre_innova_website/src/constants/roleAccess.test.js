import { canPurchase, ROLE_GROUPS } from "./roleAccess";
import { ROLES } from "./roles";

test("purchase routes are available only to administrators and clients", () => {
  expect(ROLE_GROUPS.PURCHASE).toEqual([
    ROLES.ADMINISTRADOR,
    ROLES.CLIENTE,
  ]);
  expect(ROLE_GROUPS.PURCHASE).not.toContain(ROLES.VENDEDOR);
  expect(canPurchase(ROLES.ADMINISTRADOR)).toBe(true);
  expect(canPurchase(ROLES.CLIENTE)).toBe(true);
  expect(canPurchase(ROLES.VENDEDOR)).toBe(false);
});
