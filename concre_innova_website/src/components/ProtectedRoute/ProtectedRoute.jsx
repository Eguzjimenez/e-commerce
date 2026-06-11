import { Navigate, useLocation } from "react-router-dom";
import { getAuth } from "../../services/authService";
import { PUBLIC_ROUTES } from "../../routes/routes";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const auth = getAuth();

  if (!auth) {
    return <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.nombreRol)) {
    console.warn(
      `[Acceso denegado] Usuario ID=${auth.idUsuario} (Rol=${auth.idRol}) ` +
      `intentó acceder a ruta protegida: ${location.pathname}`
    );

    return (
      <Navigate
        to="/acceso-denegado"
        state={{ from: location, userRole: auth.idRol }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
