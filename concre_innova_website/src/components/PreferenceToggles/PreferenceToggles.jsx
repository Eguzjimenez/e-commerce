import "./PreferenceToggles.css";
import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Mail, MailX, Moon, Sun } from "lucide-react";
import {
  getPreferences,
  getStoredTheme,
  storeTheme,
  updatePreferences,
} from "../../services/preferencesService";

/**
 * Preferencias como interruptores en la esquina de la barra: sustituyen a la
 * pantalla de Configuracion. Cada icono muestra su estado y lo guarda al
 * instante, sin formulario ni boton de guardar.
 */
function PreferenceToggles() {
  const [preferencias, setPreferencias] = useState({
    notificacionesActivas: true,
    notificacionesCorreo: true,
    tema: getStoredTheme(),
  });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;

    getPreferences()
      .then((datos) => {
        if (!vigente) return;

        const tema = datos?.tema === "oscuro" ? "oscuro" : "claro";
        setPreferencias({
          notificacionesActivas: Boolean(datos?.notificacionesActivas),
          notificacionesCorreo: Boolean(datos?.notificacionesCorreo),
          tema,
        });
        storeTheme(tema);
      })
      .catch(() => {
        // Sin preferencias guardadas se mantienen los valores por defecto.
      });

    return () => {
      vigente = false;
    };
  }, []);

  const alternar = useCallback(
    async (campo) => {
      const siguiente =
        campo === "tema"
          ? { ...preferencias, tema: preferencias.tema === "oscuro" ? "claro" : "oscuro" }
          : { ...preferencias, [campo]: !preferencias[campo] };

      setPreferencias(siguiente);

      if (campo === "tema") {
        storeTheme(siguiente.tema);
      }

      setGuardando(true);

      try {
        await updatePreferences(siguiente);
      } catch {
        // Si el guardado falla se revierte para no mentir sobre el estado.
        setPreferencias(preferencias);
        if (campo === "tema") {
          storeTheme(preferencias.tema);
        }
      } finally {
        setGuardando(false);
      }
    },
    [preferencias]
  );

  const opciones = [
    {
      campo: "tema",
      activo: preferencias.tema === "oscuro",
      Icono: preferencias.tema === "oscuro" ? Moon : Sun,
      etiqueta:
        preferencias.tema === "oscuro"
          ? "Modo oscuro activado"
          : "Modo oscuro desactivado",
    },
    {
      campo: "notificacionesActivas",
      activo: preferencias.notificacionesActivas,
      Icono: preferencias.notificacionesActivas ? Bell : BellOff,
      etiqueta: preferencias.notificacionesActivas
        ? "Avisos en la aplicación activados"
        : "Avisos en la aplicación desactivados",
    },
    {
      campo: "notificacionesCorreo",
      activo: preferencias.notificacionesCorreo,
      Icono: preferencias.notificacionesCorreo ? Mail : MailX,
      etiqueta: preferencias.notificacionesCorreo
        ? "Avisos por correo activados"
        : "Avisos por correo desactivados",
    },
  ];

  return (
    <div className="preference-toggles" role="group" aria-label="Preferencias">
      {opciones.map(({ campo, activo, Icono, etiqueta }) => (
        <button
          key={campo}
          type="button"
          className={`preference-toggle ${activo ? "is-on" : "is-off"}`}
          onClick={() => alternar(campo)}
          disabled={guardando}
          aria-pressed={activo}
          title={etiqueta}
          aria-label={etiqueta}
        >
          <Icono size={17} strokeWidth={1.85} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default PreferenceToggles;
