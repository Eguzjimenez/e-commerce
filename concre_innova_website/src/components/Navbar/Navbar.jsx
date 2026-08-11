import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getAuth, getUserRole, isLoggedIn, logout } from "../../services/authService";
import { isAdminRole } from "../../constants/roleAccess";
import { ROLES } from "../../constants/roles";
import { getCartCount } from "../../services/cartService";
import { getFavoriteCountAsync } from "../../services/favoriteService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState(getAuth());
  const [cartCount, setCartCount] = useState(getCartCount());
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
    setAuth(getAuth());
    setCartCount(getCartCount());
    getFavoriteCountAsync().then(setFavoriteCount).catch(() => setFavoriteCount(0));
  }, [location.pathname]);

  useEffect(() => {
    const refreshFavoriteCount = () => {
      getFavoriteCountAsync().then(setFavoriteCount).catch(() => setFavoriteCount(0));
    };
    const handleAuthChange = () => {
      setAuth(getAuth());
      refreshFavoriteCount();
    };
    const handleCartChange = () => setCartCount(getCartCount());
    const handleFavoritesChange = refreshFavoriteCount;
    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("cartchange", handleCartChange);
    window.addEventListener("favoriteschange", handleFavoritesChange);

    return () => {
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("cartchange", handleCartChange);
      window.removeEventListener("favoriteschange", handleFavoritesChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setAuth(null);
    navigate(PUBLIC_ROUTES.HOME);
  };

  const authenticated = isLoggedIn() && auth;
  const userRole = getUserRole();
  const admin = isAdminRole(userRole);
  const isClient = userRole === ROLES.CLIENTE;
  const showAdminOnlyMenu = authenticated && admin;
  const logoRoute = showAdminOnlyMenu ? ADMIN_ROUTES.DASHBOARD : PUBLIC_ROUTES.HOME;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={logoRoute} className="nav-logo">
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
          {showAdminOnlyMenu ? (
            <>
              <li>
                <Link to={ADMIN_ROUTES.DASHBOARD}>Panel</Link>
              </li>
              <li>
                <button className="logout-btn" type="button" onClick={handleLogout}>
                  Cerrar sesion
                </button>
              </li>
            </>
          ) : (
            <>
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
              {authenticated && (
                <li>
                  <Link to={PRIVATE_ROUTES.MY_ORDERS}>Mis pedidos</Link>
                </li>
              )}
              <li>
                <Link to={PUBLIC_ROUTES.FAVORITES}>
                  Mis Favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
                </Link>
              </li>
              {authenticated && isClient && (
                <li>
                  <Link to={PRIVATE_ROUTES.MY_ACCOUNT}>Mi cuenta</Link>
                </li>
              )}
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
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
