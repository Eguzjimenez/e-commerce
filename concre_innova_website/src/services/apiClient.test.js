import { request } from "./apiClient";

function createResponse({
  ok = true,
  status = 200,
  statusText = "OK",
  body = "",
} = {}) {
  return {
    ok,
    status,
    statusText,
    text: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
  global.fetch = jest.fn();
});

test("returns parsed JSON for a successful response", async () => {
  fetch.mockResolvedValue(
    createResponse({ body: JSON.stringify({ exitoso: true }) })
  );

  await expect(request("/api/test")).resolves.toEqual({ exitoso: true });
});

test("returns null for a successful empty response", async () => {
  fetch.mockResolvedValue(createResponse({ status: 204 }));

  await expect(request("/api/test")).resolves.toBeNull();
});

test("preserves a successful non-JSON response as text", async () => {
  fetch.mockResolvedValue(createResponse({ body: "respuesta de texto" }));

  await expect(request("/api/test")).resolves.toBe("respuesta de texto");
});

test("throws the backend message and status for a server error", async () => {
  fetch.mockResolvedValue(
    createResponse({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      body: JSON.stringify({ message: "No fue posible completar la solicitud." }),
    })
  );

  await expect(request("/api/test")).rejects.toMatchObject({
    message: "No fue posible completar la solicitud.",
    status: 500,
  });
});

test("propagates a network connection failure", async () => {
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));

  await expect(request("/api/test")).rejects.toThrow("Failed to fetch");
});

test("clears the stored session after an authenticated 401 response", async () => {
  localStorage.setItem(
    "concre_innova_auth",
    JSON.stringify({ idUsuario: 17, idRol: 3, token: "expired" })
  );
  const authChangeListener = jest.fn();
  window.addEventListener("authchange", authChangeListener);
  fetch.mockResolvedValue(
    createResponse({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      body: JSON.stringify({ message: "La sesion expiro." }),
    })
  );

  await expect(request("/api/Carrito/mis-pedidos")).rejects.toMatchObject({
    status: 401,
  });

  expect(localStorage.getItem("concre_innova_auth")).toBeNull();
  expect(authChangeListener).toHaveBeenCalledTimes(1);
  window.removeEventListener("authchange", authChangeListener);
});
