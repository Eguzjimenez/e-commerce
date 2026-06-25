import { request } from "./apiClient";

export async function getCategoriesAdministracion() {
  return await request("/api/Categorias/administracion", { method: "GET" });
}

export async function createCategory(category) {
  return await request("/api/Categorias", {
    method: "POST",
    body: category,
  });
}

export async function updateCategory(idCategoria, category) {
  return await request(`/api/Categorias/${idCategoria}`, {
    method: "PUT",
    body: category,
  });
}

export async function deleteCategory(idCategoria) {
  return await request(`/api/Categorias/${idCategoria}`, {
    method: "DELETE",
  });
}
