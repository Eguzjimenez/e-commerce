import "./AdminOrders.css";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminOrders() {
  const orders = [
    {
      id: 1,
      numeroPedido: "PED-001",
      cliente: "María López",
      fecha: "2026-04-10",
      total: 128.5,
      estado: "Pendiente"
    },
    {
      id: 2,
      numeroPedido: "PED-002",
      cliente: "Carlos Herrera",
      fecha: "2026-04-11",
      total: 89.99,
      estado: "En proceso"
    },
    {
      id: 3,
      numeroPedido: "PED-003",
      cliente: "Ana Rodríguez",
      fecha: "2026-04-12",
      total: 245.0,
      estado: "Enviado"
    },
    {
      id: 4,
      numeroPedido: "PED-004",
      cliente: "Luis Méndez",
      fecha: "2026-04-13",
      total: 56.75,
      estado: "Entregado"
    },
    {
      id: 5,
      numeroPedido: "PED-005",
      cliente: "Sofía Vargas",
      fecha: "2026-04-13",
      total: 42.0,
      estado: "Cancelado"
    },
    {
      id: 6,
      numeroPedido: "PED-006",
      cliente: "Pedro Gómez",
      fecha: "2026-04-14",
      total: 310.2,
      estado: "Pendiente"
    }
  ];

  const [busqueda, setBusqueda] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("Todos");

  const estados = ["Todos", ...new Set(orders.map((order) => order.estado))];

  const pedidosFiltrados = useMemo(() => {
    return orders.filter((order) => {
      const coincideBusqueda =
        order.numeroPedido.toLowerCase().includes(busqueda.toLowerCase()) ||
        order.cliente.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado =
        estadoSeleccionado === "Todos" || order.estado === estadoSeleccionado;

      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, estadoSeleccionado]);

  return (
    <AdminLayout title="Gestión de Pedidos">
      <div className="admin-orders-page">
        <div className="admin-orders-topbar">
          <div className="admin-orders-filters">
            <input
              type="text"
              placeholder="Buscar por número o cliente"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="admin-orders-search"
            />

            <select
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
              className="admin-orders-select"
            >
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-primary-button">Actualizar estado</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Número de pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {pedidosFiltrados.map((order) => (
                <tr key={order.id}>
                  <td>{order.numeroPedido}</td>
                  <td>{order.cliente}</td>
                  <td>{order.fecha}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span
                      className={`order-status-badge ${
                        order.estado === "Pendiente"
                          ? "status-pendiente"
                          : order.estado === "En proceso"
                          ? "status-proceso"
                          : order.estado === "Enviado"
                          ? "status-enviado"
                          : order.estado === "Entregado"
                          ? "status-entregado"
                          : "status-cancelado"
                      }`}
                    >
                      {order.estado}
                    </span>
                  </td>
                  <td>
                    <div className="order-action-buttons">
                      <button className="order-action-btn">Ver</button>
                      <button className="order-action-btn secondary">Editar</button>
                    </div>
                  </td>
                </tr>
              ))}

              {pedidosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty-row">
                    No se encontraron pedidos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrders;