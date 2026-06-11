import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "../../services/authService";
import "./AccessDenied.css";

function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  const attemptedPath = location.state?.from?.pathname || "ruta desconocida";

  return (
    <div className="access-denied-wrapper">
      <div className="access-denied-card">
        <div className="access-denied-icon">🔒</div>

        <h1 className="access-denied-title">Acceso Denegado</h1>

        <p className="access-denied-message">
          No tienes permisos para acceder a esta sección.
        </p>

        <div className="access-denied-detail">
          <p>
            <strong>Usuario:</strong> {auth?.correo ?? "Desconocido"}
          </p>
          <p>
            <strong>Sección solicitada:</strong>{" "}
            <code>{attemptedPath}</code>
          </p>
          <p className="access-denied-warning">
            Este intento de acceso ha sido registrado.
          </p>
        </div>

        <div className="access-denied-actions">
          <button
            className="access-denied-btn primary"
            onClick={() => navigate("/")}
          >
            Ir al inicio
          </button>
          <button
            className="access-denied-btn secondary"
            onClick={() => navigate(-1)}
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
