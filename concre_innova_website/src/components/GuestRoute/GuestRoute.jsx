import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserRole, isLoggedIn } from "../../services/authService";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { ROLES } from "../../constants/roles";

/**
 * Pantallas que solo tienen sentido antes de iniciar sesion (login, registro,
 * recuperacion). Con una sesion activa dejan de ser utiles, asi que se redirige
 * a cada rol a la vista con la que realmente trabaja.
 */
function GuestRoute({ children }) {
  const location = useLocation();
  const [autenticado, setAutenticado] = useState(isLoggedIn());

  useEffect(() => {
    const handleAuthChange = () => setAutenticado(isLoggedIn());
    window.addEventListener("authchange", handleAuthChange);

    return () => window.removeEventListener("authchange", handleAuthChange);
  }, []);

  if (!autenticado) {
    return children;
  }

  const rol = getUserRole();
  const destinoPrevio = location.state?.from?.pathname;

  if (destinoPrevio) {
    return <Navigate to={destinoPrevio} replace />;
  }

  if (rol === ROLES.ADMINISTRADOR) {
    return <Navigate to={ADMIN_ROUTES.DASHBOARD} replace />;
  }

  if (rol === ROLES.VENDEDOR) {
    return <Navigate to={ADMIN_ROUTES.PRODUCTS} replace />;
  }

  return <Navigate to={PUBLIC_ROUTES.HOME} replace />;
}

export default GuestRoute;
