import "./NotificationBell.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import Swal from "sweetalert2";
import NotificationItem from "../NotificationItem/NotificationItem";
import { PRIVATE_ROUTES } from "../../routes/routes";
import { openChatAssistant } from "../../services/chatService";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_POLL_INTERVAL_MS,
  NOTIFICATIONS_PREVIEW_SIZE,
  NOTIFICATION_TYPES,
  getNotificationSummary,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

const LAST_ALERT_STORAGE_KEY = "concre_innova_ultima_notificacion";

function readLastAlertedId() {
  try {
    return Number(localStorage.getItem(LAST_ALERT_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function storeLastAlertedId(idNotificacion) {
  try {
    localStorage.setItem(LAST_ALERT_STORAGE_KEY, String(idNotificacion));
  } catch {
    // Un almacenamiento no disponible no debe interrumpir la navegacion.
  }
}

function showInstantAlert(notification) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: notification.titulo,
    text: notification.mensaje,
    showConfirmButton: false,
    timer: 6000,
    timerProgressBar: true,
  });
}

/**
 * Indicador de notificaciones de la barra de navegacion. Consulta el resumen
 * de forma periodica para avisar de los eventos nuevos y muestra las ultimas
 * notificaciones en un desplegable.
 */
function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastAlertedIdRef = useRef(readLastAlertedId());
  const containerRef = useRef(null);

  const alertNewNotification = useCallback((ultimaNoLeida) => {
    if (!ultimaNoLeida?.idNotificacion) {
      return;
    }

    if (ultimaNoLeida.idNotificacion <= lastAlertedIdRef.current) {
      return;
    }

    lastAlertedIdRef.current = ultimaNoLeida.idNotificacion;
    storeLastAlertedId(ultimaNoLeida.idNotificacion);
    showInstantAlert(ultimaNoLeida);
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const summary = await getNotificationSummary();

      setUnreadCount(summary.noLeidas);
      alertNewNotification(summary.ultimaNoLeida);
    } catch {
      // El indicador no debe interrumpir la navegacion si el API falla.
    }
  }, [alertNewNotification]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const page = await getNotifications({
        pagina: 1,
        tamanoPagina: NOTIFICATIONS_PREVIEW_SIZE,
      });

      setNotifications(page.items);
      setUnreadCount(page.noLeidas);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSummary();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshSummary();
      }
    }, NOTIFICATIONS_POLL_INTERVAL_MS);

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshSummary);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshSummary);
    };
  }, [refreshSummary]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const togglePanel = () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      loadPreview();
    }
  };

  const handleOpenNotification = async (notification) => {
    setOpen(false);

    if (!notification.leida) {
      try {
        await markNotificationAsRead(notification.idNotificacion);
      } catch {
        // Aunque falle la marca de lectura, el usuario debe poder navegar.
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

    navigate(PRIVATE_ROUTES.NOTIFICATIONS);
  };

  const handleMarkAsRead = async (notification) => {
    try {
      await markNotificationAsRead(notification.idNotificacion);
      await loadPreview();
    } catch (markError) {
      setError(markError.message || "No se pudo actualizar la notificacion.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadPreview();
    } catch (markError) {
      setError(markError.message || "No se pudieron actualizar las notificaciones.");
    }
  };

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="nav-icon-link notification-bell-button"
        onClick={togglePanel}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
      >
        <Bell size={21} strokeWidth={1.75} />
        <span className="nav-icon-label">Avisos</span>
        {unreadCount > 0 && <span className="nav-count-badge">{badgeLabel}</span>}
      </button>

      {open && (
        <div className="notification-bell-panel" role="dialog" aria-label="Notificaciones">
          <header className="notification-bell-panel-header">
            <h2>Notificaciones</h2>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllAsRead}>
                Marcar todas
              </button>
            )}
          </header>

          <div className="notification-bell-panel-body">
            {loading && <p className="notification-bell-state">Cargando...</p>}
            {!loading && error && (
              <p className="notification-bell-state error">{error}</p>
            )}
            {!loading && !error && notifications.length === 0 && (
              <p className="notification-bell-state">
                Todavia no tenes notificaciones.
              </p>
            )}

            {!loading &&
              !error &&
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.idNotificacion}
                  notification={notification}
                  compact
                  onOpen={handleOpenNotification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
          </div>

          <footer className="notification-bell-panel-footer">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(PRIVATE_ROUTES.NOTIFICATIONS);
              }}
            >
              Ver todas
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
