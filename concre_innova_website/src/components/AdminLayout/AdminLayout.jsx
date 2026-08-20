import "./AdminLayout.css";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_ITEMS, getAdminPanelName } from "../../constants/adminNavigation";
import { getUserRole } from "../../services/authService";

function AdminLayout({ title, subtitle, children }) {
  const userRole = getUserRole();
  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const panelName = getAdminPanelName(userRole);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-row">
            <span className="admin-brand-mark" aria-hidden="true"></span>
            <h2>Concre Innova</h2>
          </div>
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
        {/* El titulo de la pantalla vive solo aqui: cada vista aporta su propio
            subtitulo en vez de repetir un encabezado dentro del contenido. */}
        <header className="admin-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}

export default AdminLayout;
