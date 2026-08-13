import "./NotificationItem.css";
import { Bell, Check, FileText, MessageCircle, Package } from "lucide-react";
import {
  NOTIFICATION_TYPES,
  formatNotificationDate,
} from "../../services/notificationService";

const TYPE_ICONS = {
  [NOTIFICATION_TYPES.ORDER]: Package,
  [NOTIFICATION_TYPES.QUOTATION]: FileText,
  [NOTIFICATION_TYPES.CHAT]: MessageCircle,
  [NOTIFICATION_TYPES.GENERAL]: Bell,
};

function getTypeIcon(tipo) {
  return TYPE_ICONS[tipo] || Bell;
}

/**
 * Fila reutilizable de la bandeja de notificaciones. Se usa tanto en el
 * desplegable de la barra de navegacion como en la pantalla completa.
 */
function NotificationItem({ notification, compact = false, onOpen, onMarkAsRead }) {
  const TypeIcon = getTypeIcon(notification?.tipo);
  const unread = !notification?.leida;
  const className = [
    "notification-item",
    compact ? "compact" : "",
    unread ? "unread" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={className}>
      <button
        type="button"
        className="notification-item-main"
        onClick={() => onOpen?.(notification)}
      >
        <span className="notification-item-icon" aria-hidden="true">
          <TypeIcon size={compact ? 16 : 18} strokeWidth={1.8} />
        </span>

        <span className="notification-item-body">
          <span className="notification-item-title">{notification?.titulo}</span>
          <span className="notification-item-message">{notification?.mensaje}</span>
          <span className="notification-item-date">
            {formatNotificationDate(notification?.fechaEnvio)}
          </span>
        </span>

        {unread && <span className="notification-item-dot" aria-label="Sin leer" />}
      </button>

      {unread && onMarkAsRead && (
        <button
          type="button"
          className="notification-item-read"
          onClick={() => onMarkAsRead(notification)}
          title="Marcar como leida"
          aria-label={`Marcar como leida: ${notification?.titulo}`}
        >
          <Check size={15} strokeWidth={2} />
          {!compact && <span>Marcar como leida</span>}
        </button>
      )}
    </article>
  );
}

export default NotificationItem;
