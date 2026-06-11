import { request } from "./apiClient";
import { ROL_ID_MAP } from "../constants/roles";

const AUTH_STORAGE_KEY = "concre_innova_auth";

export async function login({ correo, contrasena }) {
  const data = await request("/api/Auth/login", {
    method: "POST",
    body: { correo, contrasena },
  });

  const auth = {
    correo,
    idUsuario: data?.idUsuario ?? null,
    idRol: data?.idRol ?? null,
    nombreRol: ROL_ID_MAP[data?.idRol] ?? null,
    codigo: data?.codigo,
    mensaje: data?.mensaje,
    loggedAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  return auth;
}

export async function validateEmail(correo) {
  return await request("/api/Auth/validate-email", {
    method: "POST",
    body: { correo },
  });
}

export async function resetPassword({ idUsuario, nuevaContrasena }) {
  return await request("/api/Auth/reset-password", {
    method: "POST",
    body: { idUsuario, nuevaContrasena },
  });
}
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getUserId() {
  return getAuth()?.idUsuario ?? null;
}

export function getUserRole() {
  return getAuth()?.idRol ?? null;
}

export function isVendor() {
  return getUserRole() === 2;
}

export function isLoggedIn() {
  return Boolean(getAuth());
}

export function isAdmin() {
  return getUserRole() === "Administrador";
}

export function isClient() {
  return getUserRole() === "Cliente";
}
