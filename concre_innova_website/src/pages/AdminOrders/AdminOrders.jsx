import "./AdminOrders.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import {
  cancelOrder,
  getAdminOrderDetail,
  getAdminOrders,
  updateOrderStatus,
} from "../../services/orderService";
import { DEFAULT_PAGINATION, normalizePaginatedResponse } from "../../services/paginationService";

const ADMIN_ORDERS_PAGE_SIZE = 10;

const ORDER_STATES = ["Pendiente", "En proceso", "Enviado", "Entregado", "Cancelado"];
const EDITABLE_STATES = ["Pendiente", "En proceso", "Enviado", "Entregado"];

function getStatusClass(estado) {
  switch (estado) {
    case "Pendiente":
      return "status-pendiente";
    case "En proceso":
      return "status-proceso";
    case "Enviado":
      return "status-enviado";
    case "Entregado":
      return "status-entregado";
    default:
      return "status-cancelado";
  }
}

function isOrderLocked(estado) {
  return estado === "Cancelado" || estado === "Entregado";
}

function AdminOrders() {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("Todos");
  const [orderPage, setOrderPage] = useState(1);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: ADMIN_ORDERS_PAGE_SIZE,
  });

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editEstado, setEditEstado] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders(orderPage);
  }, [orderPage, busqueda, estadoSeleccionado]);

  const loadOrders = async (page = orderPage) => {
    setLoading(true);
    setError("");

    try {
      const response = await getAdminOrders({
        busqueda,
        estado: estadoSeleccionado === "Todos" ? "" : estadoSeleccionado,
        pagina: page,
        tamanoPagina: ADMIN_ORDERS_PAGE_SIZE,
      });
      const pagedOrders = normalizePaginatedResponse(response, page, ADMIN_ORDERS_PAGE_SIZE);

      setOrderList(pagedOrders.items);
      setPagination(pagedOrders);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los pedidos.");
      setOrderList([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        pageNumber: page,
        pageSize: ADMIN_ORDERS_PAGE_SIZE,
      });
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = async (order) => {
    setShowViewModal(true);
    setViewLoading(true);
    setViewOrder(null);

    try {
      const detail = await getAdminOrderDetail(order.idPedido);
      setViewOrder(detail);
    } catch (viewError) {
      setShowViewModal(false);
      await Swal.fire({
        icon: "error",
        title: "No se pudo cargar el pedido",
        text: viewError.message || "Error al obtener el detalle del pedido.",
      });
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewOrder(null);
  };

  const openEditModal = (order) => {
    setEditOrder(order);
    setEditEstado(order.estado);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (!saving) {
      setShowEditModal(false);
      setEditOrder(null);
    }
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();

    if (!editOrder) {
      return;
    }

    setSaving(true);
    try {
      await updateOrderStatus(editOrder.idPedido, editEstado);

      setShowEditModal(false);
      setEditOrder(null);

      await Swal.fire({
        icon: "success",
        title: "Pedido actualizado",
        text: "El estado del pedido se actualizo correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      await loadOrders(orderPage);
    } catch (updateError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: updateError.message || "Error al actualizar el estado del pedido.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async (order) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Cancelar pedido",
      text: `Deseas cancelar el pedido #${order.idPedido}?`,
      showCancelButton: true,
      confirmButtonText: "Si, cancelar",
      cancelButtonText: "Volver",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await cancelOrder(order.idPedido);
      await Swal.fire({
        icon: "success",
        title: "Pedido cancelado",
        text: "El pedido fue cancelado correctamente.",
      });
      await loadOrders(orderPage);
    } catch (cancelError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo cancelar",
        text: cancelError.message || "Error al cancelar el pedido.",
      });
    }
  };

  return (
    <AdminLayout title="Pedidos"
      subtitle="Consulta el detalle, cambia el estado y cancela cuando corresponda.">
      <div className="admin-orders-page">
        <div className="admin-orders-topbar">
          <div className="admin-orders-filters">
            <input
              type="text"
              placeholder="Buscar por número o cliente"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setOrderPage(1);
              }}
              className="admin-orders-search"
            />

            <select
              value={estadoSeleccionado}
              onChange={(e) => {
                setEstadoSeleccionado(e.target.value);
                setOrderPage(1);
              }}
              className="admin-orders-select"
            >
              <option value="Todos">Todos</option>
              {ORDER_STATES.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="admin-products-error">{error}</div>}

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
              {loading && (
                <tr>
                  <td colSpan="6" className="admin-empty-row">
                    Cargando pedidos...
                  </td>
                </tr>
              )}

              {!loading && orderList.map((order) => (
                <tr key={order.idPedido}>
                  <td>{`PED-${String(order.idPedido).padStart(3, "0")}`}</td>
                  <td>{order.nombreCliente}</td>
                  <td>{new Date(order.fechaPedido).toLocaleDateString()}</td>
                  <td>${Number(order.total).toFixed(2)}</td>
                  <td>
                    <span className={`order-status-badge ${getStatusClass(order.estado)}`}>
                      {order.estado}
                    </span>
                  </td>
                  <td>
                    <div className="order-action-buttons">
                      <button className="order-action-btn secondary" onClick={() => openViewModal(order)}>
                        Ver
                      </button>
                      <button
                        className="order-action-btn"
                        onClick={() => openEditModal(order)}
                        disabled={isOrderLocked(order.estado)}
                      >
                        Editar
                      </button>
                      <button
                        className="order-action-btn secondary"
                        onClick={() => handleCancelOrder(order)}
                        disabled={isOrderLocked(order.estado)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && orderList.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty-row">
                    No se encontraron pedidos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && pagination.totalItems > ADMIN_ORDERS_PAGE_SIZE && (
          <PaginationControls
            pagination={pagination}
            isLoading={loading}
            onPageChange={setOrderPage}
          />
        )}

        {showViewModal && (
          <div className="admin-modal-backdrop" onClick={closeViewModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Detalle del pedido</h3>
                <button className="admin-modal-close" onClick={closeViewModal}>
                  ×
                </button>
              </div>

              {viewLoading && <p>Cargando detalle...</p>}

              {!viewLoading && viewOrder && (
                <div className="admin-view-order">
                  <p><strong>Pedido:</strong> {`PED-${String(viewOrder.idPedido).padStart(3, "0")}`}</p>
                  <p><strong>Fecha:</strong> {new Date(viewOrder.fechaPedido).toLocaleString()}</p>
                  <p><strong>Estado:</strong> {viewOrder.estado}</p>
                  <p><strong>Cliente:</strong> {viewOrder.nombreCliente}</p>
                  <p><strong>Correo:</strong> {viewOrder.correoCliente}</p>
                  <p><strong>Teléfono:</strong> {viewOrder.telefonoCliente || "-"}</p>
                  <p><strong>Dirección de entrega:</strong> {viewOrder.direccionEntrega}</p>
                  <p><strong>Metodo de pago:</strong> {viewOrder.metodoPago || "-"}</p>
                  <p><strong>Total:</strong> ${Number(viewOrder.total).toFixed(2)}</p>

                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewOrder.detalle || []).map((linea) => (
                        <tr key={linea.idDetallePedido}>
                          <td>
                            {linea.nombreVariante
                              ? `${linea.nombre} - ${linea.nombreVariante}`
                              : linea.nombre}
                          </td>
                          <td>{linea.cantidad}</td>
                          <td>${Number(linea.precioUnitario).toFixed(2)}</td>
                          <td>${Number(linea.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="admin-modal-actions">
                <button type="button" className="order-action-btn secondary" onClick={closeViewModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editOrder && (
          <div className="admin-modal-backdrop" onClick={closeEditModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{`Actualizar estado - PED-${String(editOrder.idPedido).padStart(3, "0")}`}</h3>
                <button className="admin-modal-close" onClick={closeEditModal} disabled={saving}>
                  ×
                </button>
              </div>

              <form className="admin-modal-form" onSubmit={handleUpdateStatus}>
                <label>
                  Nuevo estado
                  <select
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value)}
                  >
                    {EDITABLE_STATES.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-modal-actions">
                  <button type="button" className="order-action-btn secondary" onClick={closeEditModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="order-action-btn" disabled={saving}>
                    {saving ? "Actualizando..." : "Actualizar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminOrders;
