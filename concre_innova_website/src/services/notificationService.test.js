import { request } from "./apiClient";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notificationService";

jest.mock("./apiClient", () => ({
  API_BASE_URL: "http://localhost:5222",
  request: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test("requests the notification inbox with the unread filter and pagination", async () => {
  request.mockResolvedValue({ items: [], totalItems: 0, noLeidas: 0 });

  await getNotifications({ soloNoLeidas: true, pagina: 2, tamanoPagina: 5 });

  expect(request).toHaveBeenCalledWith(
    "/api/Notificaciones?soloNoLeidas=true&pagina=2&tamanoPagina=5",
    expect.objectContaining({ method: "GET" })
  );
});

test("normalizes the inbox response and keeps the unread total", async () => {
  request.mockResolvedValue({
    items: [{ idNotificacion: 4, titulo: "Pedido registrado", leida: false }],
    totalItems: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    noLeidas: 3,
  });

  const page = await getNotifications();

  expect(page.items).toHaveLength(1);
  expect(page.totalItems).toBe(1);
  expect(page.noLeidas).toBe(3);
});

test("returns a safe summary when the API omits values", async () => {
  request.mockResolvedValue({});

  const summary = await getNotificationSummary();

  expect(request).toHaveBeenCalledWith(
    "/api/Notificaciones/resumen",
    expect.objectContaining({ method: "GET" })
  );
  expect(summary).toEqual({ noLeidas: 0, ultimaNoLeida: null });
});

test("marks a single notification as read and announces the change", async () => {
  request.mockResolvedValue({ exitoso: true, noLeidas: 0 });
  const listener = jest.fn();
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);

  await markNotificationAsRead(7);

  expect(request).toHaveBeenCalledWith("/api/Notificaciones/7/lectura", {
    method: "PUT",
  });
  expect(listener).toHaveBeenCalledTimes(1);

  window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);
});

test("marks every notification as read and announces the change", async () => {
  request.mockResolvedValue({ exitoso: true, noLeidas: 0 });
  const listener = jest.fn();
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);

  await markAllNotificationsAsRead();

  expect(request).toHaveBeenCalledWith("/api/Notificaciones/lectura", {
    method: "PUT",
  });
  expect(listener).toHaveBeenCalledTimes(1);

  window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, listener);
});
