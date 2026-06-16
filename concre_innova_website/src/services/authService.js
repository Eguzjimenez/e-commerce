import { request } from "./apiClient";
import { ROL_ID_MAP } from "../constants/roles";
import { isVendorRole } from "../constants/roleAccess";

const AUTH_STORAGE_KEY = "concre_innova_auth";

function notifyAuthChanged() {
  window.dispatchEvent(new Event("authchange"));
}

export async function login({ correo, contrasena }) {
  const data = await request("/api/Auth/login", {
    method: "POST",
    body: { correo, contrasena },
  });

  if (data?.codigo !== 1) {
    throw new Error(data?.mensaje || "No se pudo iniciar sesion.");
  }

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
  notifyAuthChanged();
  return auth;
}

export async function registerClient({ nombre, correo, telefono, contrasena }) {
  return await request("/api/Auth/register-client", {
    method: "POST",
    body: { nombre, correo, telefono, contrasena },
  });
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
  notifyAuthChanged();
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserId() {
  return getAuth()?.idUsuario ?? null;
}

export function getUserRole() {
  const auth = getAuth();
  return auth?.nombreRol || ROL_ID_MAP[auth?.idRol] || null;
}

export function isVendor() {
  return isVendorRole(getUserRole());
}

export function isLoggedIn() {
  const auth = getAuth();
  return Boolean(auth?.codigo === 1 && auth?.idUsuario && auth?.idRol !== 4);
}
