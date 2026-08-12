import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Heart,
  ImagePlus,
  ListChecks,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { ADMIN_ROUTES, PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getAuth, getUserRole, isLoggedIn, logout } from "../../services/authService";
import {
  canManageQuotations,
  canPurchase,
  isAdminRole,
} from "../../constants/roleAccess";
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
  const [navSearchTerm, setNavSearchTerm] = useState("");

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
  const quotationStaff = canManageQuotations(userRole);
  const purchaseAccess = canPurchase(userRole);
  const isClient = userRole === ROLES.CLIENTE;
  const logoRoute = authenticated && admin
    ? ADMIN_ROUTES.DASHBOARD
    : PUBLIC_ROUTES.HOME;
  const isActivePath = (path) =>
    path === PUBLIC_ROUTES.HOME ? location.pathname === path : location.pathname.startsWith(path);
  const getNavLinkClass = (path, className = "") =>
    [className, isActivePath(path) ? "active" : ""].filter(Boolean).join(" ");

  const handleNavSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearch = navSearchTerm.trim();
    const nextCatalogRoute = trimmedSearch
      ? `${PUBLIC_ROUTES.CATALOG}?search=${encodeURIComponent(trimmedSearch)}`
      : PUBLIC_ROUTES.CATALOG;

    navigate(nextCatalogRoute);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <form className="nav-search-form" onSubmit={handleNavSearchSubmit}>
          <button type="submit" className="nav-search-button" aria-label="Buscar productos">
            <Search size={21} strokeWidth={1.8} />
          </button>
          <input
            type="search"
            placeholder="Search"
            aria-label="Buscar productos"
            value={navSearchTerm}
            onChange={(event) => setNavSearchTerm(event.target.value)}
          />
        </form>

        <Link to={logoRoute} className="nav-brand-block">
          <span className="nav-logo">Concre Innova</span>
          <span className="nav-location">Naranjo, Alajuela</span>
        </Link>

        <div className="nav-utility-actions" aria-label="Accesos rapidos">
          {!authenticated && (
            <>
              <Link
                to={PUBLIC_ROUTES.LOGIN}
                className={getNavLinkClass(PUBLIC_ROUTES.LOGIN, "nav-icon-link")}
                aria-current={isActivePath(PUBLIC_ROUTES.LOGIN) ? "page" : undefined}
              >
                <UserRound size={22} strokeWidth={1.75} />
                <span className="nav-icon-label">Account</span>
              </Link>
              <Link
                to={PUBLIC_ROUTES.REGISTER}
                className={getNavLinkClass(PUBLIC_ROUTES.REGISTER, "nav-icon-link nav-register-link")}
                aria-current={isActivePath(PUBLIC_ROUTES.REGISTER) ? "page" : undefined}
              >
                <UserPlus size={21} strokeWidth={1.75} />
                <span className="nav-icon-label">Sign up</span>
              </Link>
            </>
          )}

          {authenticated && (
            <button className="nav-icon-link nav-logout-button" type="button" onClick={handleLogout}>
              <LogOut size={21} strokeWidth={1.75} />
              <span className="nav-icon-label">Salir</span>
            </button>
          )}

          <Link
            to={PRIVATE_ROUTES.CART}
            className={getNavLinkClass(PRIVATE_ROUTES.CART, "nav-icon-link nav-bag-link")}
            aria-current={isActivePath(PRIVATE_ROUTES.CART) ? "page" : undefined}
          >
            <ShoppingBag size={22} strokeWidth={1.75} />
            <span className="nav-icon-label">Cart</span>
            {cartCount > 0 && <span className="nav-count-badge">{cartCount}</span>}
          </Link>
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

      <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
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
            Catalogo
          </Link>
        </li>
        {authenticated && purchaseAccess && (
          <li>
            <Link
              to={PRIVATE_ROUTES.NEW_QUOTATION}
              className={getNavLinkClass(PRIVATE_ROUTES.NEW_QUOTATION)}
              aria-current={isActivePath(PRIVATE_ROUTES.NEW_QUOTATION) ? "page" : undefined}
            >
              <ImagePlus size={15} strokeWidth={1.8} />
              Cotizar
            </Link>
          </li>
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
        {authenticated && purchaseAccess && (
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
        {authenticated && purchaseAccess && (
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
        {quotationStaff && (
          <li>
            <Link
              to={admin ? ADMIN_ROUTES.DASHBOARD : ADMIN_ROUTES.QUOTATIONS}
              className={getNavLinkClass(
                admin ? ADMIN_ROUTES.DASHBOARD : ADMIN_ROUTES.QUOTATIONS
              )}
              aria-current={
                isActivePath(
                  admin ? ADMIN_ROUTES.DASHBOARD : ADMIN_ROUTES.QUOTATIONS
                )
                  ? "page"
                  : undefined
              }
            >
              <ShieldCheck size={15} strokeWidth={1.8} />
              {admin ? "Panel" : "Atencion de cotizaciones"}
            </Link>
          </li>
        )}
        <li>
          <Link
            to={PUBLIC_ROUTES.CHAT}
            className={getNavLinkClass(PUBLIC_ROUTES.CHAT)}
            aria-current={isActivePath(PUBLIC_ROUTES.CHAT) ? "page" : undefined}
          >
            <MessageCircle size={15} strokeWidth={1.8} />
            Chat
          </Link>
        </li>
        {authenticated && (
          <li className="nav-menu-auth-action">
            <button className="logout-btn" type="button" onClick={handleLogout}>
              <LogOut size={15} strokeWidth={1.8} />
              Cerrar sesion
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
