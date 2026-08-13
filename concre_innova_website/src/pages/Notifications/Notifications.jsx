import "./Notifications.css";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, CheckCheck } from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import NotificationItem from "../../components/NotificationItem/NotificationItem";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { ROLE_GROUPS } from "../../constants/roleAccess";
import { getUserRole } from "../../services/authService";
import { openChatAssistant } from "../../services/chatService";
import { DEFAULT_PAGINATION } from "../../services/paginationService";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_PAGE_SIZE,
  NOTIFICATION_TYPES,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

const FILTERS = [
  { id: "todas", label: "Todas", soloNoLeidas: false },
  { id: "no-leidas", label: "Sin leer", soloNoLeidas: true },
];

function Notifications() {
  const navigate = useNavigate();
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterId, setFilterId] = useState(FILTERS[0].id);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    const filter = FILTERS.find((option) => option.id === filterId) || FILTERS[0];

    setLoading(true);
    setError("");

    try {
      const page = await getNotifications({
        soloNoLeidas: filter.soloNoLeidas,
        pagina: pageNumber,
        tamanoPagina: NOTIFICATIONS_PAGE_SIZE,
      });

      setPagination(page);
      setUnreadCount(page.noLeidas);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar tus notificaciones.");
    } finally {
      setLoading(false);
    }
  }, [filterId, pageNumber]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadNotifications);
    return () =>
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadNotifications);
  }, [loadNotifications]);

  const handleFilterChange = (nextFilterId) => {
    setFilterId(nextFilterId);
    setPageNumber(1);
  };

  const handleOpenNotification = async (notification) => {
    if (!notification.leida) {
      try {
        await markNotificationAsRead(notification.idNotificacion);
      } catch {
        // La navegacion no debe bloquearse si falla la marca de lectura.
      }
    }

    if (notification.enlace) {
      navigate(notification.enlace);
      return;
    }

    if (notification.tipo === NOTIFICATION_TYPES.CHAT) {
      openChatAssistant();
      return;
    }

    await loadNotifications();
  };

  const handleMarkAsRead = async (notification) => {
    try {
      await markNotificationAsRead(notification.idNotificacion);
      await loadNotifications();
    } catch (markError) {
      setError(markError.message || "No se pudo actualizar la notificacion.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setPageNumber(1);
      await loadNotifications();
    } catch (markError) {
      setError(markError.message || "No se pudieron actualizar las notificaciones.");
    }
  };

  const panelUser = ROLE_GROUPS.SALES_MANAGEMENT.includes(getUserRole());

  const content = (
    <>
      <div className="notifications-toolbar">
        <div className="notifications-filters" role="tablist">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={filterId === filter.id}
              className={filterId === filter.id ? "active" : ""}
              onClick={() => handleFilterChange(filter.id)}
              disabled={loading}
            >
              {filter.label}
              {filter.soloNoLeidas && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="notifications-mark-all"
          onClick={handleMarkAllAsRead}
          disabled={loading || unreadCount === 0}
        >
          <CheckCheck size={16} strokeWidth={1.9} />
          Marcar todas como leidas
        </button>
      </div>

      {loading && <p className="notifications-state">Cargando notificaciones...</p>}
      {!loading && error && <p className="notifications-state error">{error}</p>}

      {!loading && !error && pagination.items.length === 0 && (
        <p className="notifications-state">
          No hay notificaciones para mostrar en esta vista.
        </p>
      )}

      {!loading && !error && pagination.items.length > 0 && (
        <>
          <div className="notifications-list">
            {pagination.items.map((notification) => (
              <NotificationItem
                key={notification.idNotificacion}
                notification={notification}
                onOpen={handleOpenNotification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={setPageNumber}
              isLoading={loading}
            />
          )}
        </>
      )}
    </>
  );

  if (panelUser) {
    return (
      <AdminLayout title="Notificaciones">
        <div className="notifications-panel">{content}</div>
      </AdminLayout>
    );
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <span>
          <BellRing size={15} strokeWidth={1.9} aria-hidden="true" /> Actividad
        </span>
        <h1>Mis notificaciones</h1>
        <p>
          Consulta los avisos de tus pedidos, cotizaciones y conversaciones con el
          equipo.
        </p>
      </header>

      {content}
    </main>
  );
}

export default Notifications;
