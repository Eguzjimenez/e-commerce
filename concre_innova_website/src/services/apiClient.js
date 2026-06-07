const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:7258";

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const init = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
    const message = data?.mensaje || data?.error || response.statusText;
    throw new Error(message || "Error en la solicitud");
  }

  return data;
}

export { API_BASE_URL, request };
