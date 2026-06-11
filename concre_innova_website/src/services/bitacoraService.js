import { request } from "./apiClient";

export async function getBitacora() {
  return await request("/api/Bitacora/List");
}

export async function registerBitacora({ idUsuario, tablaAfectada, operacion, descripcion }) {
  return await request("/api/Bitacora/Register", {
    method: "POST",
    body: { idUsuario, tablaAfectada, operacion, descripcion },
  });
}
