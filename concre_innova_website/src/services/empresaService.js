import { request } from "./apiClient";

export async function getCompanyInfo() {
  return request("/api/Empresa/informacion", {
    method: "GET",
    skipAuthHeaders: true,
  });
}

export async function updateCompanyInfo(informacion) {
  return request("/api/Empresa/informacion", {
    method: "PUT",
    body: informacion,
  });
}

export async function sendContactMessage({ nombre, correo, telefono, asunto, mensaje }) {
  return request("/api/Empresa/contacto", {
    method: "POST",
    body: {
      nombre: String(nombre || "").trim(),
      correo: String(correo || "").trim(),
      telefono: String(telefono || "").trim(),
      asunto: String(asunto || "").trim(),
      mensaje: String(mensaje || "").trim(),
    },
  });
}

export async function getContactMessages({ estado = "", pagina = 1, tamanoPagina = 20 } = {}) {
  const query = new URLSearchParams({
    pagina: String(pagina),
    tamanoPagina: String(tamanoPagina),
  });

  if (estado) {
    query.set("estado", estado);
  }

  return request(`/api/Empresa/mensajes?${query.toString()}`, {
    method: "GET",
  });
}
