import "./AdminLayout.css";
import { NavLink } from "react-router-dom";
import { ADMIN_ROUTES } from "../../routes/routes";

function AdminLayout({ title, children }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>Concre Innova</h2>
          <p>Panel de Administración</p>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink
            to={ADMIN_ROUTES.DASHBOARD}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Panel principal
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.INVENTORY}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Inventario
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.PRODUCTS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Productos
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.CATEGORIES}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Categorías
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.QUOTATIONS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Cotizaciones
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.ORDERS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Pedidos
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.CHAT}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Chat administrativo
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.USERS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Usuarios
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.REPORTS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Reportes
          </NavLink>

          <NavLink
            to={ADMIN_ROUTES.STATISTICS}
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            Estadísticas
          </NavLink>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{title}</h1>
            <p>Gestiona las operaciones del negocio desde un solo lugar</p>
          </div>

          <div className="admin-header-user">
            <span>Administrador</span>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}

export default AdminLayout;