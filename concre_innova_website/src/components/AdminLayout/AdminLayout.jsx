import "./AdminLayout.css";
import { NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../../routes/routes";
import { ROLES } from "../../constants/roles";
import { getUserRole } from "../../services/authService";

const navItems = [
  {
    to: ADMIN_ROUTES.DASHBOARD,
    label: "Panel principal",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.INVENTORY,
    label: "Inventario",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.PRODUCTS,
    label: "Productos",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.CATEGORIES,
    label: "Categorias",
    roles: [ROLES.ADMINISTRADOR],
  },
  {
    to: ADMIN_ROUTES.QUOTATIONS,
    label: "Cotizaciones",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.ORDERS,
    label: "Pedidos",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.CHAT,
    label: "Chat administrativo",
    roles: [ROLES.ADMINISTRADOR, ROLES.VENDEDOR],
  },
  {
    to: ADMIN_ROUTES.USERS,
    label: "Usuarios",
    roles: [ROLES.ADMINISTRADOR],
  },
  {
    to: ADMIN_ROUTES.REPORTS,
    label: "Reportes",
    roles: [ROLES.ADMINISTRADOR],
  },
  {
    to: ADMIN_ROUTES.STATISTICS,
    label: "Estadisticas",
    roles: [ROLES.ADMINISTRADOR],
  },
  {
    to: ADMIN_ROUTES.BITACORA,
    label: "Bitacora",
    roles: [ROLES.ADMINISTRADOR],
  },
];

function AdminLayout({ title, children }) {
  const userRole = getUserRole();
  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));
  const panelName =
    userRole === ROLES.VENDEDOR ? "Panel de Ventas" : "Panel de Administracion";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>Concre Innova</h2>
          <p>{panelName}</p>
        </div>

        <nav className="admin-sidebar-nav">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{title}</h1>
            <p>Gestiona las operaciones del negocio desde un solo lugar</p>
          </div>

          <div className="admin-header-user">
            <span>{userRole || "Usuario"}</span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}

export default AdminLayout;
