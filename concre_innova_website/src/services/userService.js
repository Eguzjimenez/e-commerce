import { request } from "./apiClient";

export async function getUserList() {
  return await request("/api/Users/UserList", {
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
