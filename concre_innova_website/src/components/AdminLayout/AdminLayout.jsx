import "./AdminLayout.css";
import { NavLink } from "react-router-dom";
import { ADMIN_NAV_ITEMS, getAdminPanelName } from "../../constants/adminNavigation";
import { getUserRole } from "../../services/authService";

function AdminLayout({ title, children }) {
  const userRole = getUserRole();
  const visibleItems = ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const panelName = getAdminPanelName(userRole);

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
