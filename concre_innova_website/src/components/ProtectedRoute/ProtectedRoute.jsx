import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth, isLoggedIn } from "../../services/authService";
import { ROL_ID_MAP } from "../../constants/roles";
import { PUBLIC_ROUTES } from "../../routes/routes";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => {
    const handleAuthChange = () => setAuth(getAuth());
    window.addEventListener("authchange", handleAuthChange);

    return () => window.removeEventListener("authchange", handleAuthChange);
  }, []);

  if (!isLoggedIn()) {
    return <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const roleName = auth?.nombreRol || ROL_ID_MAP[auth?.idRol];

  if (allowedRoles && !allowedRoles.includes(roleName)) {
    console.warn(
      `[Acceso denegado] Usuario ID=${auth.idUsuario} (Rol=${auth.idRol}) ` +
      `intento acceder a ruta protegida: ${location.pathname}`
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
