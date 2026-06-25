import { request } from "./apiClient";
import { ROL_ID_MAP } from "../constants/roles";
import { isVendorRole } from "../constants/roleAccess";
import { getCartPayloadForAuth } from "./cartService";

const AUTH_STORAGE_KEY = "concre_innova_auth";

function notifyAuthChanged() {
  window.dispatchEvent(new Event("authchange"));
}

function extractToken(response) {
  if (!response) {
    return null;
  }

  const directToken =
    response?.token ||
    response?.accessToken ||
    response?.jwt ||
    response?.recoveryToken ||
    response?.data?.token ||
    response?.data?.accessToken ||
    response?.data?.jwt ||
    response?.data?.recoveryToken;

  if (directToken) {
    return directToken;
  }

  const message = response?.mensaje || response?.message || "";
  const match = message.match(/token=([A-Za-z0-9_-]+)/i);
  return match?.[1] || null;
}

export async function login({ correo, contrasena }) {
  const data = await request("/api/Auth/login", {
    method: "POST",
    body: {
      correo,
      contrasena,
      carritoTemporal: getCartPayloadForAuth(),
    },
    skipAuthHeaders: true,
  });

  if (data?.codigo !== 1) {
    throw new Error(data?.mensaje || "No se pudo iniciar sesion.");
  }

  const token = extractToken(data);

  const auth = {
    correo,
    idUsuario: data?.idUsuario ?? null,
    idRol: data?.idRol ?? null,
    nombreRol: ROL_ID_MAP[data?.idRol] ?? null,
    token,
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
    skipAuthHeaders: true,
  });
}

export async function validateEmail(correo) {
  return await request("/api/Auth/validate-email", {
    method: "POST",
    body: { correo },
    skipAuthHeaders: true,
  });
}

export async function requestPasswordResetCode(correo) {
  return await request("/api/Auth/generate-recovery-token", {
    method: "POST",
    body: { correo },
    skipAuthHeaders: true,
  });
}

export async function verifyRecoveryCode({ correo, codigo }) {
  return await request("/api/Auth/verify-recovery-code", {
    method: "POST",
    body: { correo, codigo },
    skipAuthHeaders: true,
  });
}

export async function resetPassword({ recoveryToken, nuevaContrasena }) {
  return await request("/api/Auth/reset-password", {
    method: "POST",
    body: { recoveryToken, nuevaContrasena },
    skipAuthHeaders: true,
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

export async function verifyStoredRecoveryToken() {
  return true;
}
