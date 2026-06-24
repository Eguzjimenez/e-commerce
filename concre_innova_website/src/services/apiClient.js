const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:7258";
const AUTH_STORAGE_KEY = "concre_innova_auth";

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

async function request(path, options = {}) {
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

  const response = await fetch(url, init);
  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
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

export { API_BASE_URL, request };
