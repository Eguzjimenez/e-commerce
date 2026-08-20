import "./NotificationList.css";
import NotificationItem from "../NotificationItem/NotificationItem";
import { NOTIFICATIONS_COPY } from "../../services/notificationService";

/**
 * Lista de notificaciones compartida por el desplegable de la campana y la
 * pantalla completa. Centraliza los estados de carga, error y vacio para que
 * ambas superficies se vean y se lean igual.
 */
function NotificationList({
  notifications = [],
  loading = false,
  error = "",
  emptyMessage = NOTIFICATIONS_COPY.vacio,
  compact = false,
  onOpen,
  onMarkAsRead,
}) {
  const className = ["notification-list", compact ? "compact" : ""]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <p className="notification-list-state" role="status">
        {NOTIFICATIONS_COPY.cargando}
      </p>
    );
  }

  if (error) {
    return (
      <p className="notification-list-state is-error" role="alert">
        {error}
      </p>
    );
  }

  if (notifications.length === 0) {
    return <p className="notification-list-state">{emptyMessage}</p>;
  }

  return (
    <div className={className}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.idNotificacion}
          notification={notification}
          compact={compact}
          onOpen={onOpen}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  );
}

export default NotificationList;
