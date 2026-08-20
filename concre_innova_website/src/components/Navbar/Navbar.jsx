import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Heart,
  ListChecks,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import NotificationBell from "../NotificationBell/NotificationBell";
import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getAuth, getUserRole, isLoggedIn, logout } from "../../services/authService";
import {
  canPurchase,
  isAdminRole,
  isStaffRole,
} from "../../constants/roleAccess";
import { ROLES } from "../../constants/roles";
import { ADMIN_NAV_ITEMS } from "../../constants/adminNavigation";
import { getCartCount } from "../../services/cartService";
import PreferenceToggles from "../PreferenceToggles/PreferenceToggles";
import { getFavoriteCountAsync } from "../../services/favoriteService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState(getAuth());
  const [cartCount, setCartCount] = useState(getCartCount());
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Los favoritos son por usuario: sin sesion la peticion solo produce un 401.
  const refreshFavoriteCount = useCallback(() => {
    if (!isLoggedIn()) {
      setFavoriteCount(0);
      return;
    }

    getFavoriteCountAsync().then(setFavoriteCount).catch(() => setFavoriteCount(0));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAuth(getAuth());
    setCartCount(getCartCount());
    refreshFavoriteCount();
  }, [location.pathname, refreshFavoriteCount]);

  useEffect(() => {
    const handleAuthChange = () => {
      setAuth(getAuth());
      refreshFavoriteCount();
    };
    const handleCartChange = () => setCartCount(getCartCount());
    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("cartchange", handleCartChange);
    window.addEventListener("favoriteschange", refreshFavoriteCount);

    return () => {
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("cartchange", handleCartChange);
      window.removeEventListener("favoriteschange", refreshFavoriteCount);
    };
  }, [refreshFavoriteCount]);

  const handleLogout = () => {
    logout();
    setAuth(null);
    navigate(PUBLIC_ROUTES.HOME);
  };

  const authenticated = isLoggedIn() && auth;
  const userRole = getUserRole();
  const admin = isAdminRole(userRole);
  // El vendedor tambien opera el panel interno: no debe ver la navegacion de compra.
  const staff = isStaffRole(userRole);
  const purchaseAccess = canPurchase(userRole);
  const isClient = userRole === ROLES.CLIENTE;
  const panelRoute = admin ? ADMIN_ROUTES.DASHBOARD : ADMIN_ROUTES.PRODUCTS;
  const logoRoute = authenticated && staff
    ? panelRoute
    : PUBLIC_ROUTES.HOME;
  const isActivePath = (path) =>
    path === PUBLIC_ROUTES.HOME ? location.pathname === path : location.pathname.startsWith(path);
  const navClassName = ["navbar", "navbar-compact", staff ? "navbar-admin" : ""]
    .filter(Boolean)
    .join(" ");
  const getNavLinkClass = (path, className = "") =>
    [className, isActivePath(path) ? "active" : ""].filter(Boolean).join(" ");

  return (
    <nav className={navClassName}>
      <div className="nav-container">
        {authenticated && <PreferenceToggles />}

        <Link to={logoRoute} className="nav-brand-block">
          <span className="nav-logo">Concre Innova</span>
          <span className="nav-location">Naranjo, Alajuela</span>
        </Link>

        <div className="nav-utility-actions" aria-label="Accesos rápidos">
          {staff && <span className="nav-role">{userRole}</span>}

          {staff && (
            <Link
              to={panelRoute}
              className={getNavLinkClass(panelRoute, "nav-icon-link nav-panel-link")}
              aria-current={isActivePath(panelRoute) ? "page" : undefined}
            >
              <ShieldCheck size={20} strokeWidth={1.75} />
              <span className="nav-icon-label">Panel</span>
            </Link>
          )}

          {!authenticated && (
            <>
              <Link
                to={PUBLIC_ROUTES.LOGIN}
                className={getNavLinkClass(PUBLIC_ROUTES.LOGIN, "nav-icon-link")}
                aria-current={isActivePath(PUBLIC_ROUTES.LOGIN) ? "page" : undefined}
              >
                <UserRound size={22} strokeWidth={1.75} />
                <span className="nav-icon-label">Ingresar</span>
              </Link>
              <Link
                to={PUBLIC_ROUTES.REGISTER}
                className={getNavLinkClass(PUBLIC_ROUTES.REGISTER, "nav-icon-link nav-register-link")}
                aria-current={isActivePath(PUBLIC_ROUTES.REGISTER) ? "page" : undefined}
              >
                <UserPlus size={21} strokeWidth={1.75} />
                <span className="nav-icon-label">Registro</span>
              </Link>
            </>
          )}

          {authenticated && <NotificationBell />}

          {authenticated && (
            <button className="nav-icon-link nav-logout-button" type="button" onClick={handleLogout}>
              <LogOut size={21} strokeWidth={1.75} />
              <span className="nav-icon-label">Salir</span>
            </button>
          )}

          {!staff && (
            <Link
              to={PRIVATE_ROUTES.CART}
              className={getNavLinkClass(PRIVATE_ROUTES.CART, "nav-icon-link nav-bag-link")}
              aria-current={isActivePath(PRIVATE_ROUTES.CART) ? "page" : undefined}
            >
              <ShoppingBag size={22} strokeWidth={1.75} />
              <span className="nav-icon-label">Carrito</span>
              {cartCount > 0 && <span className="nav-count-badge">{cartCount}</span>}
            </Link>
          )}
        </div>

        <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
        </button>
      </div>

      <ul className={`nav-menu ${menuOpen ? "active" : ""} ${staff ? "nav-menu-staff" : ""}`.trim()}>
        {/* El panel dejo de tener barra lateral propia: sus accesos viven en
            este mismo menu, para que la navegacion sea una sola. */}
        {staff &&
          ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(userRole)).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={getNavLinkClass(item.to)}
                aria-current={isActivePath(item.to) ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        {!staff && (
          <>
            <li>
              <Link
                to={PUBLIC_ROUTES.HOME}
                className={getNavLinkClass(PUBLIC_ROUTES.HOME)}
                aria-current={isActivePath(PUBLIC_ROUTES.HOME) ? "page" : undefined}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to={PUBLIC_ROUTES.CATALOG}
                className={getNavLinkClass(PUBLIC_ROUTES.CATALOG)}
                aria-current={isActivePath(PUBLIC_ROUTES.CATALOG) ? "page" : undefined}
              >
                Catálogo
              </Link>
            </li>
            <li>
              <Link
                to={PUBLIC_ROUTES.CONTACT}
                className={getNavLinkClass(PUBLIC_ROUTES.CONTACT)}
                aria-current={isActivePath(PUBLIC_ROUTES.CONTACT) ? "page" : undefined}
              >
                <Mail size={15} strokeWidth={1.8} />
                Contacto
              </Link>
            </li>
          </>
        )}
        {authenticated && isClient && (
          <li>
            <Link
              to={PRIVATE_ROUTES.MY_ACCOUNT}
              className={getNavLinkClass(PRIVATE_ROUTES.MY_ACCOUNT)}
              aria-current={isActivePath(PRIVATE_ROUTES.MY_ACCOUNT) ? "page" : undefined}
            >
              <UserRound size={15} strokeWidth={1.8} />
              Mi cuenta
            </Link>
          </li>
        )}
        {authenticated && purchaseAccess && !staff && (
          <li>
            <Link
              to={PRIVATE_ROUTES.MY_QUOTATIONS}
              className={getNavLinkClass(PRIVATE_ROUTES.MY_QUOTATIONS)}
              aria-current={isActivePath(PRIVATE_ROUTES.MY_QUOTATIONS) ? "page" : undefined}
            >
              <ListChecks size={15} strokeWidth={1.8} />
              Mis cotizaciones
            </Link>
          </li>
        )}
        {authenticated && purchaseAccess && !staff && (
          <li>
            <Link
              to={PRIVATE_ROUTES.MY_ORDERS}
              className={getNavLinkClass(PRIVATE_ROUTES.MY_ORDERS)}
              aria-current={isActivePath(PRIVATE_ROUTES.MY_ORDERS) ? "page" : undefined}
            >
              <ClipboardList size={15} strokeWidth={1.8} />
              Mis pedidos
            </Link>
          </li>
        )}
        {!staff && (
          <li>
            <Link
              to={PUBLIC_ROUTES.FAVORITES}
              className={getNavLinkClass(PUBLIC_ROUTES.FAVORITES)}
              aria-current={isActivePath(PUBLIC_ROUTES.FAVORITES) ? "page" : undefined}
            >
              <Heart size={15} strokeWidth={1.8} />
              Favoritos{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
            </Link>
          </li>
        )}
        {authenticated && (
          <li className="nav-menu-auth-action">
            <button className="logout-btn" type="button" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={1.8} />
              Cerrar sesión
            </button>
          </li>
        )}
        {!authenticated && (
          <li className="nav-menu-auth-action">
            <Link
              to={PUBLIC_ROUTES.REGISTER}
              className={getNavLinkClass(PUBLIC_ROUTES.REGISTER)}
              aria-current={isActivePath(PUBLIC_ROUTES.REGISTER) ? "page" : undefined}
            >
              <UserPlus size={15} strokeWidth={1.8} />
              Registro
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
