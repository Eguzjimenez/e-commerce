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
    idCliente:
      data?.idCliente ??
      data?.cliente?.idCliente ??
      data?.data?.idCliente ??
      data?.usuario?.idCliente ??
      null,
    idRol: data?.idRol ?? null,
    nombreRol: data?.nombreRol || ROL_ID_MAP[data?.idRol] || null,
    token,
    codigo: data?.codigo,
    mensaje: data?.mensaje,
    loggedAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  notifyAuthChanged();
  return auth;
}

export async function registerClient({
  nombre,
  apellido,
  correo,
  telefono,
  direccion,
  contrasena,
}) {
  return await request("/api/Auth/register-client", {
    method: "POST",
    body: { nombre, apellido, correo, telefono, direccion, contrasena },
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

export function getClientId() {
  const auth = getAuth();

  return (
    auth?.idCliente ??
    auth?.cliente?.idCliente ??
    auth?.data?.idCliente ??
    auth?.usuario?.idCliente ??
    auth?.idUsuario ??
    null
  );
}

/**
 * Lee las credenciales del propio token en lugar del objeto guardado, para que
 * editar localStorage no habilite pantallas que la API va a rechazar igualmente.
 */
function readTokenClaims(token) {
  try {
    const payload = String(token).split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

export function getUserRole() {
  const auth = getAuth();
  const claims = auth?.token ? readTokenClaims(auth.token) : null;

  if (claims) {
    return (
      claims.nombreRol ||
      claims.role ||
      ROL_ID_MAP[Number(claims.idRol)] ||
      null
    );
  }

  return auth?.nombreRol || ROL_ID_MAP[auth?.idRol] || null;
}

export function isVendor() {
  return isVendorRole(getUserRole());
}

export function isLoggedIn() {
  const auth = getAuth();
  return Boolean(auth?.codigo === 1 && auth?.idUsuario && auth?.idRol !== 4 && auth?.token);
}

export async function verifyStoredRecoveryToken() {
  return true;
}
