import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getAuth, getUserRole, isLoggedIn, logout } from "../../services/authService";
import { ROLES } from "../../constants/roles";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState(getAuth());

  useEffect(() => {
    setMenuOpen(false);
    setAuth(getAuth());
  }, [location.pathname]);

  useEffect(() => {
    const handleAuthChange = () => setAuth(getAuth());
    window.addEventListener("authchange", handleAuthChange);

    return () => window.removeEventListener("authchange", handleAuthChange);
  }, []);

  const handleLogout = () => {
    logout();
    setAuth(null);
    navigate(PUBLIC_ROUTES.HOME);
  };

  const authenticated = isLoggedIn() && auth;
  const admin = getUserRole() === ROLES.ADMINISTRADOR;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={PUBLIC_ROUTES.HOME} className="nav-logo">
          Concre Innova
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
          <li>
            <Link to={PUBLIC_ROUTES.HOME}>Inicio</Link>
          </li>
          <li>
            <Link to={PUBLIC_ROUTES.CATALOG}>Catalogo</Link>
          </li>
          {authenticated && (
            <li>
              <Link to={PRIVATE_ROUTES.CART}>Carrito</Link>
            </li>
          )}
          {admin && (
            <li>
              <Link to={ADMIN_ROUTES.DASHBOARD}>Admin</Link>
            </li>
          )}
          <li>
            <Link to={PUBLIC_ROUTES.CHAT}>Chat</Link>
          </li>
          {!authenticated && (
            <>
              <li>
                <Link to={PUBLIC_ROUTES.LOGIN}>Login</Link>
              </li>
              <li>
                <Link to={PUBLIC_ROUTES.REGISTER}>Registro</Link>
              </li>
            </>
          )}
          {authenticated && (
            <li>
              <button className="logout-btn" type="button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
