import "./Notifications.css";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, CheckCheck } from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import NotificationList from "../../components/NotificationList/NotificationList";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { ROLE_GROUPS } from "../../constants/roleAccess";
import { getUserRole } from "../../services/authService";
import { openChatAssistant } from "../../services/chatService";
import { DEFAULT_PAGINATION } from "../../services/paginationService";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_COPY,
  NOTIFICATIONS_PAGE_SIZE,
  NOTIFICATION_TYPES,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

const FILTERS = [
  { id: "todas", label: "Todas", soloNoLeidas: false },
  { id: "no-leidas", label: NOTIFICATIONS_COPY.sinLeer, soloNoLeidas: true },
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
      setError(loadError.message || NOTIFICATIONS_COPY.errorCarga);
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
      setError(markError.message || NOTIFICATIONS_COPY.errorMarcar);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setPageNumber(1);
      await loadNotifications();
    } catch (markError) {
      setError(markError.message || NOTIFICATIONS_COPY.errorMarcarTodas);
    }
  };

  const panelUser = ROLE_GROUPS.SALES_MANAGEMENT.includes(getUserRole());
  const totalRegistros = pagination.totalItems ?? pagination.items.length;

  const content = (
    <>
      <div className="notifications-toolbar">
        <div className="notifications-filters" role="tablist" aria-label="Filtrar avisos">
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
          <CheckCheck size={16} strokeWidth={1.9} aria-hidden="true" />
          {NOTIFICATIONS_COPY.marcarTodas}
        </button>
      </div>

      {!loading && !error && totalRegistros > 0 && (
        <p className="notifications-summary">
          {totalRegistros} {totalRegistros === 1 ? "aviso" : "avisos"}
          {unreadCount > 0 ? ` · ${unreadCount} sin leer` : " · todos leídos"}
        </p>
      )}

      <NotificationList
        notifications={pagination.items}
        loading={loading}
        error={error}
        emptyMessage={
          filterId === "no-leidas"
            ? NOTIFICATIONS_COPY.vacioSinLeer
            : NOTIFICATIONS_COPY.vacio
        }
        onOpen={handleOpenNotification}
        onMarkAsRead={handleMarkAsRead}
      />

      {!loading && !error && pagination.totalPages > 1 && (
        <PaginationControls
          pagination={pagination}
          onPageChange={setPageNumber}
          isLoading={loading}
        />
      )}
    </>
  );

  if (panelUser) {
    return (
      <AdminLayout title={NOTIFICATIONS_COPY.titulo}>
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
