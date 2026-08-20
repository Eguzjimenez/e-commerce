const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5222";
const AUTH_STORAGE_KEY = "concre_innova_auth";

function clearExpiredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("authchange"));
}

/**
 * Pide un token nuevo con el que aun esta guardado. Se usa cuando una peticion
 * responde 401: antes se cerraba la sesion de inmediato y la persona quedaba
 * fuera a mitad de una tarea.
 */
async function tryRefreshSession() {
  const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");

  if (!auth?.token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (!data?.token) {
      return false;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...auth, token: data.token }));
    return true;
  } catch {
    return false;
  }
}

function getAuthHeaders() {
  try {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawAuth) {
      return {};
    }

    const auth = JSON.parse(rawAuth);
    const headers = {};

    if (auth?.idUsuario != null) {
      headers["X-User-Id"] = String(auth.idUsuario);
    }

    if (auth?.idRol != null) {
      headers["X-User-Role"] = String(auth.idRol);
    }

    if (auth?.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }

    return headers;
  } catch {
    return {};
  }
}

async function request(path, options = {}, reintentado = false) {
  const url = `${API_BASE_URL}${path}`;
  const { skipAuthHeaders = false, ...requestOptions } = options;
  const isFormDataBody = requestOptions.body instanceof FormData;
  const baseHeaders = {
    Accept: "application/json",
    ...(skipAuthHeaders ? {} : getAuthHeaders()),
    ...requestOptions.headers,
  };

  if (!isFormDataBody) {
    baseHeaders["Content-Type"] = "application/json";
  }

  const init = {
    headers: baseHeaders,
    credentials: requestOptions.credentials || "include",
    ...requestOptions,
  };

  if (requestOptions.body && typeof requestOptions.body !== "string" && !isFormDataBody) {
    init.body = JSON.stringify(requestOptions.body);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error(
      "No fue posible conectar con el servidor. Verifica tu conexion e intenta nuevamente."
    );
  }

  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuthHeaders) {
      // Un solo intento de renovacion antes de dar la sesion por perdida.
      if (!reintentado && (await tryRefreshSession())) {
        return request(path, options, true);
      }

      clearExpiredSession();
    }

    const message =
      data?.mensaje ||
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : response.statusText);
    const error = new Error(message || "Error en la solicitud");
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Convierte una ruta relativa devuelta por el API (por ejemplo
 * "images/visualizaciones/3/foto.jpg") en una URL absoluta servible.
 */
function buildApiFileUrl(relativePath) {
  if (!relativePath) {
    return "";
  }

  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}/${String(relativePath).replace(/^\/+/, "")}`;
}

export { API_BASE_URL, buildApiFileUrl, request };
