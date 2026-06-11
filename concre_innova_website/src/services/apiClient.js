const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5222";
const AUTH_STORAGE_KEY = "concre_innova_auth";

function getAuthHeaders() {
  try {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawAuth) {
      return {};
    }

    const auth = JSON.parse(rawAuth);
    if (!auth?.idUsuario || !auth?.idRol) {
      return {};
    }

    return {
      "X-User-Id": String(auth.idUsuario),
      "X-User-Role": String(auth.idRol),
    };
  } catch {
    return {};
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const init = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body !== "string") {
    init.body = JSON.stringify(options.body);
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
    throw new Error(message || "Error en la solicitud");
  }

  return data;
}

export { API_BASE_URL, request };
