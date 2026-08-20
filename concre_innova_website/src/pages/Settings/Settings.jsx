import "./Settings.css";
import { useEffect, useState } from "react";
import { Bell, Mail, Moon, Sun } from "lucide-react";
import Swal from "sweetalert2";
import {
  getPreferences,
  getStoredTheme,
  storeTheme,
  updatePreferences,
} from "../../services/preferencesService";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { ROLE_GROUPS } from "../../constants/roleAccess";
import { getUserRole } from "../../services/authService";

function Settings() {
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [notificacionesCorreo, setNotificacionesCorreo] = useState(true);
  const [tema, setTema] = useState(getStoredTheme());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError("");

    try {
      const preferencias = await getPreferences();

      setNotificacionesActivas(Boolean(preferencias?.notificacionesActivas));
      setNotificacionesCorreo(Boolean(preferencias?.notificacionesCorreo));

      const temaGuardado = preferencias?.tema === "oscuro" ? "oscuro" : "claro";
      setTema(temaGuardado);
      storeTheme(temaGuardado);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar tus preferencias.");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (nuevoTema) => {
    setTema(nuevoTema);
    storeTheme(nuevoTema);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const result = await updatePreferences({
        notificacionesActivas,
        notificacionesCorreo,
        tema,
      });

      if (result?.codigo !== 1) {
        throw new Error(result?.mensaje || "No se pudieron guardar las preferencias.");
      }

      storeTheme(tema);

      await Swal.fire({
        icon: "success",
        title: "Preferencias guardadas",
        text: "Tu configuracion se actualizo correctamente.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: saveError.message || "Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const panelUser = ROLE_GROUPS.SALES_MANAGEMENT.includes(getUserRole());

  const content = (
    <>
      {loading && <p className="settings-state">Cargando preferencias...</p>}
      {!loading && error && <p className="settings-state error">{error}</p>}

      {!loading && !error && (
        <form className="settings-form" onSubmit={handleSubmit}>
          <section className="settings-card">
            <header>
              <Bell size={20} aria-hidden="true" />
              <div>
                <h2>Notificaciones</h2>
                <p>Elegi que avisos queres recibir sobre tu actividad.</p>
              </div>
            </header>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notificacionesActivas}
                onChange={(event) => setNotificacionesActivas(event.target.checked)}
                disabled={saving}
              />
              <span>
                <strong>Notificaciones en la aplicacion</strong>
                <small>Avisos de pedidos, cotizaciones y respuestas del equipo.</small>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notificacionesCorreo}
                onChange={(event) => setNotificacionesCorreo(event.target.checked)}
                disabled={saving || !notificacionesActivas}
              />
              <span>
                <strong>
                  <Mail size={15} aria-hidden="true" /> Avisos por correo
                </strong>
                <small>Recibi un correo cuando cambie el estado de tus solicitudes.</small>
              </span>
            </label>
          </section>

          <section className="settings-card">
            <header>
              {tema === "oscuro" ? (
                <Moon size={20} aria-hidden="true" />
              ) : (
                <Sun size={20} aria-hidden="true" />
              )}
              <div>
                <h2>Apariencia</h2>
                <p>El tema se aplica a toda la aplicacion y se guarda en tu cuenta.</p>
              </div>
            </header>

            <div className="settings-theme-options">
              <button
                type="button"
                className={tema === "claro" ? "settings-theme active" : "settings-theme"}
                onClick={() => handleThemeChange("claro")}
                disabled={saving}
              >
                <Sun size={18} aria-hidden="true" />
                Modo claro
              </button>

              <button
                type="button"
                className={tema === "oscuro" ? "settings-theme active" : "settings-theme"}
                onClick={() => handleThemeChange("oscuro")}
                disabled={saving}
              >
                <Moon size={18} aria-hidden="true" />
                Modo oscuro
              </button>
            </div>
          </section>

          <div className="settings-actions">
            <button type="submit" className="settings-submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar preferencias"}
            </button>
          </div>
        </form>
      )}
    </>
  );

  if (panelUser) {
    return (
      <AdminLayout title="Preferencias del sistema">
        <div className="settings-panel">{content}</div>
      </AdminLayout>
    );
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <span>Configuración</span>
        <h1>Preferencias del sistema</h1>
        <p>Controla las notificaciones que recibis y la apariencia de toda la aplicacion.</p>
      </header>

      {content}
    </main>
  );
}

export default Settings;
