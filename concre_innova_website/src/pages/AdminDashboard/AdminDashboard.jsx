import "./AdminDashboard.css";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminDashboard() {
  return (
    <AdminLayout title="Panel Principal">
      <div className="admin-dashboard">
        <div className="admin-dashboard-cards">
          <div className="dashboard-card">
            <h3>Ventas del mes</h3>
            <p>$4,250</p>
          </div>

          <div className="dashboard-card">
            <h3>Pedidos pendientes</h3>
            <p>12</p>
          </div>

          <div className="dashboard-card">
            <h3>Cotizaciones pendientes</h3>
            <p>5</p>
          </div>

          <div className="dashboard-card">
            <h3>Productos con bajo stock</h3>
            <p>7</p>
          </div>
        </div>

        <div className="admin-dashboard-section">
          <h2>Resumen general</h2>
          <p>
            Esta sección mostrará más adelante gráficos, pedidos recientes y alertas del negocio.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;