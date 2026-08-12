import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { addToCart } from "../../services/cartService";
import {
  getMyOrders,
  prepareOrderReorder,
} from "../../services/orderService";
import {
  formatCatalogPrice,
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";
import { PRIVATE_ROUTES } from "../../routes/routes";
import "./History.css";

const EMPTY_FILTERS = {
  fechaDesde: "",
  fechaHasta: "",
};

function formatOrderDate(value) {
  if (!value) {
    return "Fecha no disponible";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleString("es-CR");
}

function normalizeStatus(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getStatusPresentation(value) {
  const normalizedStatus = normalizeStatus(value);

  if (normalizedStatus.includes("entreg")) {
    return { label: "Entregado", className: "history-state--delivered" };
  }

  if (normalizedStatus.includes("envi")) {
    return { label: "Enviado", className: "history-state--shipped" };
  }

  if (normalizedStatus.includes("cancel")) {
    return { label: "Cancelado", className: "history-state--cancelled" };
  }

  if (normalizedStatus.includes("proces")) {
    return { label: "Procesando", className: "history-state--processing" };
  }

  return {
    label: value || "Pendiente",
    className: "history-state--pending",
  };
}

function getOrderItemAttributes(item) {
  return [item?.nombreVariante, item?.tamano, item?.material].filter((value) =>
    String(value || "").trim()
  );
}

function getOrderItemDetails(item) {
  return [
    { label: "Tipo", value: item?.nombreTipo },
    { label: "Color", value: item?.color },
    { label: "Macetero", value: item?.macetero },
  ].filter((detail) => String(detail.value || "").trim());
}

function History() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMyOrders(appliedFilters);
      const nextOrders = Array.isArray(response?.pedidos) ? response.pedidos : [];
      setOrders(nextOrders);
      setExpandedOrderId(null);
    } catch (requestError) {
      setError(requestError?.message || "No fue posible cargar tus pedidos.");
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalOrders = orders.length;
  const totalAmount = useMemo(
    () => orders.reduce((sum, order) => sum + (Number(order?.total) || 0), 0),
    [orders]
  );

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (
      filters.fechaDesde &&
      filters.fechaHasta &&
      filters.fechaDesde > filters.fechaHasta
    ) {
      Swal.fire({
        icon: "warning",
        title: "Rango de fechas invalido",
        text: "La fecha inicial no puede ser posterior a la fecha final.",
      });
      return;
    }

    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const handleToggleOrderDetail = (idPedido) => {
    setExpandedOrderId((currentId) => (currentId === idPedido ? null : idPedido));
  };

  const handleReorder = async (idPedido) => {
    setReorderingOrderId(idPedido);

    try {
      const response = await prepareOrderReorder(idPedido);
      const items = Array.isArray(response?.items) ? response.items : [];
      const availableItems = items.filter((item) => item?.disponible);
      const unavailableItems = items.filter((item) => !item?.disponible);

      availableItems.forEach((item) => {
        const displayName = item.nombreVariante
          ? `${item.nombre} - ${item.nombreVariante}`
          : item.nombre;

        addToCart(
          {
            ...item,
            nombre: displayName,
            precio: Number(item.precio) || 0,
          },
          Math.max(1, Number(item.cantidad) || 1)
        );
      });

      if (availableItems.length === 0) {
        throw new Error(
          response?.mensaje ||
            "Los productos de este pedido no estan disponibles actualmente."
        );
      }

      const warningText = unavailableItems.length
        ? ` ${unavailableItems.length} producto(s) no se agregaron por falta de disponibilidad.`
        : "";

      const result = await Swal.fire({
        icon: unavailableItems.length ? "warning" : "success",
        title: "Productos agregados",
        text: `Se agregaron ${availableItems.length} producto(s) al carrito.${warningText}`,
        showCancelButton: true,
        confirmButtonText: "Ver carrito",
        cancelButtonText: "Seguir aqui",
      });

      if (result.isConfirmed) {
        navigate(PRIVATE_ROUTES.CART);
      }
    } catch (requestError) {
      await Swal.fire({
        icon: "error",
        title: "No fue posible volver a comprar",
        text:
          requestError?.message ||
          "No se pudieron preparar los productos del pedido.",
      });
    } finally {
      setReorderingOrderId(null);
    }
  };

  return (
    <section className="history-page container">
      <header className="history-header">
        <span className="history-eyebrow">Mi cuenta</span>
        <h1>Mis pedidos</h1>
        <p>Consulta el historial de compras registradas en tu cuenta.</p>
      </header>

      <form className="history-filters" onSubmit={handleApplyFilters}>
        <label>
          Desde
          <input
            type="date"
            value={filters.fechaDesde}
            max={filters.fechaHasta || undefined}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                fechaDesde: event.target.value,
              }))
            }
          />
        </label>

        <label>
          Hasta
          <input
            type="date"
            value={filters.fechaHasta}
            min={filters.fechaDesde || undefined}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                fechaHasta: event.target.value,
              }))
            }
          />
        </label>

        <div className="history-filter-actions">
          <button className="btn" type="submit" disabled={isLoading}>
            Aplicar filtro
          </button>
          <button
            className="history-secondary-button"
            type="button"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            Limpiar
          </button>
        </div>
      </form>

      <div className="history-summary">
        <article>
          <strong>{totalOrders}</strong>
          <span>Pedidos</span>
        </article>
        <article>
          <strong>{formatCatalogPrice(totalAmount)}</strong>
          <span>Total comprado</span>
        </article>
      </div>

      {isLoading && <p className="history-status">Cargando pedidos...</p>}
      {!isLoading && error && <p className="history-error">{error}</p>}

      {!isLoading && !error && orders.length === 0 && (
        <div className="history-empty">
          <h2>No se encontraron pedidos</h2>
          <p>
            Ajusta el rango de fechas o realiza una compra para verla en este
            historial.
          </p>
        </div>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className="history-list">
          {orders.map((order) => {
            const details = Array.isArray(order?.detalle) ? order.detalle : [];
            const status = getStatusPresentation(order.estado);
            const isExpanded = expandedOrderId === order.idPedido;
            const detailPanelId = `history-detail-${order.idPedido}`;

            return (
              <article className="history-card" key={order.idPedido}>
                <button
                  className="history-card-head"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={detailPanelId}
                  onClick={() => handleToggleOrderDetail(order.idPedido)}
                >
                  <div>
                    <h2>Pedido #{order.idPedido}</h2>
                    <p>{formatOrderDate(order.fechaPedido)}</p>
                    <p className="history-card-hint">
                      {details.length} producto(s) |{" "}
                      {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                    </p>
                  </div>
                  <span className={`history-state ${status.className}`}>
                    {status.label}
                  </span>
                </button>

                <div className="history-card-meta">
                  <p>
                    <strong>Entrega:</strong>{" "}
                    {order.direccionEntrega || "No definida"}
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    {formatCatalogPrice(order.total)}
                  </p>
                  <p>
                    <strong>Metodo de pago:</strong>{" "}
                    {order.metodoPago || "No definido"}
                  </p>
                  <p>
                    <strong>Estado de pago:</strong>{" "}
                    {order.estadoPago || "No definido"}
                  </p>
                </div>

                {isExpanded && (
                  <div className="history-items" id={detailPanelId}>
                    {details.map((item) => {
                      const attributes = getOrderItemAttributes(item);
                      const itemDetails = getOrderItemDetails(item);

                      return (
                        <div
                          className="history-item"
                          key={item.idDetallePedido}
                        >
                          <img
                            className="history-item-image"
                            src={getCatalogProductImage(item)}
                            alt={item.nombre || `Producto ${item.idProducto}`}
                            onError={(event) =>
                              handleCatalogImageFallback(event, item.imagen)
                            }
                          />

                          <div className="history-item-info">
                            <h3>
                              {item.nombre || `Producto ${item.idProducto}`}
                            </h3>
                            {attributes.length > 0 && (
                              <p className="history-item-attributes">
                                {attributes.join(" | ")}
                              </p>
                            )}
                            {itemDetails.map((detail) => (
                              <p key={detail.label}>
                                <strong>{detail.label}:</strong> {detail.value}
                              </p>
                            ))}
                            <p>
                              Cantidad: {item.cantidad} | Unitario:{" "}
                              {formatCatalogPrice(item.precioUnitario)}
                            </p>
                          </div>

                          <strong>{formatCatalogPrice(item.subtotal)}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="history-card-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => handleReorder(order.idPedido)}
                    disabled={reorderingOrderId !== null}
                  >
                    {reorderingOrderId === order.idPedido
                      ? "Preparando..."
                      : "Volver a comprar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default History;
