import { request } from "./apiClient";

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export async function getUserList(options = {}) {
  const queryString = buildQueryString({
    pagina: options.page,
    tamanoPagina: options.pageSize,
    busqueda: options.searchTerm,
    idRol: options.roleId,
  });

  return await request(`/api/Users/UserList${queryString}`, {
    method: "GET",
  });
}

export async function getUserDetail(idUsuario) {
  return await request(`/api/Users/${idUsuario}`, {
    method: "GET",
  });
}

export async function newUser(user) {
  return await request("/api/Users/NewUser", {
    method: "POST",
    body: user,
  });
}

export async function updateUser(user) {
  return await request("/api/Users/UpdateUser", {
    method: "PUT",
    body: user,
  });
}

export async function deactivateUser(idUsuario) {
  return await request(`/api/Users/${idUsuario}`, {
    method: "DELETE",
  });
}

export async function getRoles() {
  return await request("/api/Roles", {
    method: "GET",
  });
}

export async function getUserInfo(idUsuario) {
  return await request(`/api/Users/info/${Number(idUsuario)}`, {
    method: "GET",
  });
}

export async function updateUserInfo(payload) {
  return await request("/api/Users/UpdateUserInfo", {
    method: "PUT",
    body: payload,
  });
}
