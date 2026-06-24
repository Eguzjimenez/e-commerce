import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getAuth, getUserRole, isLoggedIn, logout } from "../../services/authService";
import { isStaffRole } from "../../constants/roleAccess";
import { getCartCount } from "../../services/cartService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState(getAuth());
  const [cartCount, setCartCount] = useState(getCartCount());

  useEffect(() => {
    setMenuOpen(false);
    setAuth(getAuth());
    setCartCount(getCartCount());
  }, [location.pathname]);

  useEffect(() => {
    const handleAuthChange = () => setAuth(getAuth());
    const handleCartChange = () => setCartCount(getCartCount());
    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("cartchange", handleCartChange);

    return () => {
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("cartchange", handleCartChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setAuth(null);
    navigate(PUBLIC_ROUTES.HOME);
  };

  const authenticated = isLoggedIn() && auth;
  const userRole = getUserRole();
  const staff = isStaffRole(userRole);

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
          <li>
            <Link to={PRIVATE_ROUTES.CART}>
              Carrito{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </li>
          {staff && (
            <li>
              <Link to={ADMIN_ROUTES.DASHBOARD}>Panel</Link>
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
