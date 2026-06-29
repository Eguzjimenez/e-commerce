import { request } from "./apiClient";

export async function getRolePermissions() {
  return await request("/api/Permisos/roles", { method: "GET" });
}

export async function updateRolePermissions(idRol, idPermisos) {
  return await request(`/api/Permisos/roles/${idRol}`, {
    method: "PUT",
    body: {
      idRol: Number(idRol),
      idPermisos,
    },
  });
}
