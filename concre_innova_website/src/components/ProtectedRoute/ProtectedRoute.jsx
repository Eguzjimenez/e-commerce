import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuth, getUserRole, isLoggedIn } from "../../services/authService";
import { reportDeniedAccess } from "../../services/bitacoraService";
import { PUBLIC_ROUTES } from "../../routes/routes";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => {
    const handleAuthChange = () => setAuth(getAuth());
    window.addEventListener("authchange", handleAuthChange);

    return () => window.removeEventListener("authchange", handleAuthChange);
  }, []);

  // El rol proviene del token, no del objeto guardado en el navegador.
  const roleName = getUserRole();
  const allowed = !allowedRoles || allowedRoles.includes(roleName);

  useEffect(() => {
    if (!isLoggedIn() || allowed) {
      return;
    }

    // El aviso al usuario dice que el intento queda registrado: aqui se registra.
    reportDeniedAccess(location.pathname);
  }, [allowed, location.pathname]);

  if (!isLoggedIn()) {
    return <Navigate to={PUBLIC_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (!allowed) {
    return (
      <Navigate
        to="/acceso-denegado"
        state={{ from: location, userRole: auth?.idRol }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
