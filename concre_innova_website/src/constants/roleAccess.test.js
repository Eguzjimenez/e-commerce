import {
  canManageQuotations,
  canPurchase,
  ROLE_GROUPS,
} from "./roleAccess";
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

test("quotation management is available to administrators and sellers", () => {
  expect(ROLE_GROUPS.QUOTATION_STAFF).toEqual([
    ROLES.ADMINISTRADOR,
    ROLES.VENDEDOR,
  ]);
  expect(canManageQuotations(ROLES.ADMINISTRADOR)).toBe(true);
  expect(canManageQuotations(ROLES.VENDEDOR)).toBe(true);
  expect(canManageQuotations(ROLES.CLIENTE)).toBe(false);
});
