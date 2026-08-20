import "./AdminInvoices.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle, CheckCircle2, Clock, Eye, FileDown, Search } from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import Modal from "../../components/Modal/Modal";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import { DEFAULT_PAGINATION } from "../../services/paginationService";
import { descargarDocumento } from "../../services/documentService";
import {
  INVOICE_PAGE_SIZE,
  INVOICE_PAYMENT_STATES,
  INVOICE_STATUS,
  INVOICE_STATUS_FILTERS,
  getInvoiceDetail,
  getInvoiceReceiptUrl,
  getInvoiceStatusLabel,
  getInvoices,
  updateInvoiceStatus,
} from "../../services/invoiceService";

const STATUS_CLASS = {
  [INVOICE_STATUS.PAID]: "is-paid",
  [INVOICE_STATUS.PENDING]: "is-pending",
  [INVOICE_STATUS.OVERDUE]: "is-overdue",
  [INVOICE_STATUS.REVIEW]: "is-review",
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime())
    ? "Sin fecha"
    : fecha.toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Frase corta sobre el vencimiento, para no obligar a calcular fechas. */
function describirVencimiento(factura) {
  if (factura.estadoFactura === INVOICE_STATUS.PAID) {
    return "Cobrada";
  }

  const dias = Number(factura.diasParaVencer);

  if (!Number.isFinite(dias)) {
    return "Sin plazo definido";
  }

  if (dias < 0) return `Vencida hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return "Vence hoy";
  return `Vence en ${dias} día(s)`;
}

function AdminInvoices() {
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: INVOICE_PAGE_SIZE,
  });
  const [resumen, setResumen] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detalle, setDetalle] = useState(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalleCargando, setDetalleCargando] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(INVOICE_PAYMENT_STATES[0].value);
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const guardadoEnCurso = useRef(false);

  // La consulta espera a que se termine de escribir en vez de salir por tecla.
  const busquedaDiferida = useDebouncedValue(searchTerm);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const datos = await getInvoices({
        searchTerm: busquedaDiferida,
        status,
        from,
        to,
        page,
        pageSize: INVOICE_PAGE_SIZE,
      });

      setPagination(datos);
      setResumen(datos.resumen || {});
    } catch (cargaError) {
      setError(cargaError.message || "No se pudieron cargar las facturas.");
      setPagination({ ...DEFAULT_PAGINATION, pageSize: INVOICE_PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [busquedaDiferida, status, from, to, page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltro = (accion) => {
    accion();
    setPage(1);
  };

  const abrirDetalle = async (factura) => {
    setDetalleAbierto(true);
    setDetalleCargando(true);
    setDetalle(null);

    try {
      const datos = await getInvoiceDetail(factura.idVenta);
      setDetalle(datos);
      setObservaciones(datos?.observaciones || "");
      setNuevoEstado(
        datos?.estadoFactura === INVOICE_STATUS.PAID ? "Pendiente" : "Pagada"
      );
    } catch (detalleError) {
      setDetalleAbierto(false);
      await Swal.fire({
        icon: "error",
        title: "No se pudo abrir la factura",
        text: detalleError.message || "Error al consultar la factura.",
      });
    } finally {
      setDetalleCargando(false);
    }
  };

  const guardarEstado = async () => {
    if (guardadoEnCurso.current) return;

    guardadoEnCurso.current = true;
    setGuardando(true);

    try {
      const resultado = await updateInvoiceStatus(detalle.idVenta, {
        estadoPago: nuevoEstado,
        observaciones,
      });

      setDetalleAbierto(false);
      await Swal.fire({
        icon: "success",
        title: "Factura actualizada",
        text: resultado?.mensaje || "El estado quedó registrado.",
        timer: 1700,
        showConfirmButton: false,
      });

      await cargar();
    } catch (guardarError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: guardarError.message || "Error al cambiar el estado de la factura.",
      });
    } finally {
      guardadoEnCurso.current = false;
      setGuardando(false);
    }
  };

  const items = pagination.items || [];

  const tarjetas = [
    {
      clave: "vencidas",
      valor: resumen.totalVencidas ?? 0,
      texto: "Vencidas",
      Icono: AlertTriangle,
      filtro: INVOICE_STATUS.OVERDUE,
      tono: "is-overdue",
    },
    {
      clave: "revision",
      valor: resumen.totalEnRevision ?? 0,
      texto: "En revisión",
      Icono: Eye,
      filtro: INVOICE_STATUS.REVIEW,
      tono: "is-review",
    },
    {
      clave: "pendientes",
      valor: resumen.totalPendientes ?? 0,
      texto: "Pendientes",
      Icono: Clock,
      filtro: INVOICE_STATUS.PENDING,
      tono: "is-pending",
    },
    {
      clave: "pagadas",
      valor: resumen.totalPagadas ?? 0,
      texto: "Pagadas",
      Icono: CheckCircle2,
      filtro: INVOICE_STATUS.PAID,
      tono: "is-paid",
    },
  ];

  return (
    <AdminLayout
      title="Facturas"
      subtitle="Consulta el cobro de cada pedido y gestiona lo que está pendiente o vencido."
    >
      <div className="admin-invoices-page">
        <section className="admin-invoices-summary" aria-label="Resumen de cobros">
          {tarjetas.map(({ clave, valor, texto, Icono, filtro, tono }) => (
            <button
              key={clave}
              type="button"
              className={`admin-invoice-card ${tono} ${status === filtro ? "is-active" : ""}`.trim()}
              onClick={() => cambiarFiltro(() => setStatus(status === filtro ? "" : filtro))}
              aria-pressed={status === filtro}
            >
              <Icono size={18} strokeWidth={1.9} aria-hidden="true" />
              <strong>{valor}</strong>
              <span>{texto}</span>
            </button>
          ))}

          <div className="admin-invoice-card is-total">
            <span>Monto por cobrar</span>
            <strong>{formatCatalogPrice(resumen.montoPorCobrar ?? 0)}</strong>
          </div>
        </section>

        <div className="admin-invoices-filters">
          <label className="admin-invoices-field">
            <span>Buscar</span>
            <span className="admin-invoices-search">
              <Search size={16} strokeWidth={1.9} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Cliente, correo o número"
                onChange={(event) => cambiarFiltro(() => setSearchTerm(event.target.value))}
              />
            </span>
          </label>

          <label className="admin-invoices-field">
            <span>Estado</span>
            <select
              value={status}
              onChange={(event) => cambiarFiltro(() => setStatus(event.target.value))}
            >
              {INVOICE_STATUS_FILTERS.map((filtro) => (
                <option key={filtro.value || "todos"} value={filtro.value}>
                  {filtro.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-invoices-field">
            <span>Desde</span>
            <input
              type="date"
              value={from}
              onChange={(event) => cambiarFiltro(() => setFrom(event.target.value))}
            />
          </label>

          <label className="admin-invoices-field">
            <span>Hasta</span>
            <input
              type="date"
              value={to}
              onChange={(event) => cambiarFiltro(() => setTo(event.target.value))}
            />
          </label>
        </div>

        {error && <div className="admin-products-error">{error}</div>}
        {loading && <p className="admin-invoices-state">Cargando facturas...</p>}

        {!loading && !error && items.length === 0 && (
          <p className="admin-invoices-state">No hay facturas con esos filtros.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="admin-table-wrapper admin-invoices-table-wrapper">
              <table className="admin-invoices-table">
                <thead>
                  <tr>
                    <th>Factura</th>
                    <th>Cliente</th>
                    <th>Emisión</th>
                    <th>Vencimiento</th>
                    <th className="admin-invoices-numeric">Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((factura) => (
                    <tr key={factura.idVenta}>
                      <td>
                        <strong>#{factura.idVenta}</strong>
                        <span className="admin-invoices-sub">Pedido #{factura.idPedido}</span>
                      </td>
                      <td>
                        <strong>{factura.cliente || "Sin cliente"}</strong>
                        <span className="admin-invoices-sub">{factura.correoCliente}</span>
                      </td>
                      <td>{formatDate(factura.fechaVenta)}</td>
                      <td>
                        {formatDate(factura.fechaVencimiento)}
                        <span className="admin-invoices-sub">{describirVencimiento(factura)}</span>
                      </td>
                      <td className="admin-invoices-numeric">
                        <strong>{formatCatalogPrice(factura.total)}</strong>
                      </td>
                      <td>
                        <span
                          className={`admin-invoice-badge ${STATUS_CLASS[factura.estadoFactura] || ""}`}
                        >
                          {getInvoiceStatusLabel(factura.estadoFactura)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-invoice-action"
                          onClick={() => abrirDetalle(factura)}
                        >
                          <Eye size={15} strokeWidth={1.9} aria-hidden="true" />
                          Gestionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* En pantallas angostas la tabla pasa a fichas. */}
            <ul className="admin-invoices-cards">
              {items.map((factura) => (
                <li className="admin-invoice-row" key={`ficha-${factura.idVenta}`}>
                  <div className="admin-invoice-row-head">
                    <strong>Factura #{factura.idVenta}</strong>
                    <span
                      className={`admin-invoice-badge ${STATUS_CLASS[factura.estadoFactura] || ""}`}
                    >
                      {getInvoiceStatusLabel(factura.estadoFactura)}
                    </span>
                  </div>
                  <p>{factura.cliente || "Sin cliente"}</p>
                  <p className="admin-invoices-sub">{describirVencimiento(factura)}</p>
                  <div className="admin-invoice-row-foot">
                    <strong>{formatCatalogPrice(factura.total)}</strong>
                    <button
                      type="button"
                      className="admin-invoice-action"
                      onClick={() => abrirDetalle(factura)}
                    >
                      Gestionar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {pagination.totalPages > 1 && (
              <PaginationControls
                pagination={pagination}
                isLoading={loading}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <Modal
        open={detalleAbierto}
        onClose={() => !guardando && setDetalleAbierto(false)}
        title={detalle ? `Factura #${detalle.idVenta}` : "Factura"}
      >
        {detalleCargando && <p className="admin-invoices-state">Cargando factura...</p>}

        {!detalleCargando && detalle && (
          <div className="admin-invoice-detail">
            <div className="admin-invoice-detail-head">
              <span
                className={`admin-invoice-badge ${STATUS_CLASS[detalle.estadoFactura] || ""}`}
              >
                {getInvoiceStatusLabel(detalle.estadoFactura)}
              </span>
              <strong>{formatCatalogPrice(detalle.total)}</strong>
            </div>

            <dl className="admin-invoice-specs">
              <div>
                <dt>Cliente</dt>
                <dd>{detalle.cliente || "Sin cliente"}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{detalle.correoCliente || "No registrado"}</dd>
              </div>
              <div>
                <dt>Pedido</dt>
                <dd>
                  #{detalle.idPedido} · {detalle.estadoPedido}
                </dd>
              </div>
              <div>
                <dt>Método de pago</dt>
                <dd>{detalle.metodoPago || "No indicado"}</dd>
              </div>
              <div>
                <dt>Emisión</dt>
                <dd>{formatDate(detalle.fechaVenta)}</dd>
              </div>
              <div>
                <dt>Vencimiento</dt>
                <dd>{formatDate(detalle.fechaVencimiento)}</dd>
              </div>
            </dl>

            <section className="admin-invoice-block">
              <h4>Líneas del pedido</h4>
              <ul className="admin-invoice-lines">
                {detalle.lineas?.map((linea) => (
                  <li key={linea.idDetalle}>
                    <span>
                      {linea.nombreProducto}
                      {linea.nombreVariante ? ` · ${linea.nombreVariante}` : ""}
                    </span>
                    <span>x{linea.cantidad}</span>
                    <span>{formatCatalogPrice(linea.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="admin-invoice-block">
              <h4>Pagos registrados</h4>
              {detalle.pagos?.length > 0 ? (
                <ul className="admin-invoice-lines">
                  {detalle.pagos.map((pago) => (
                    <li key={pago.idPago}>
                      <span>
                        {pago.metodoPago}
                        {pago.referencia ? ` · Ref. ${pago.referencia}` : ""}
                      </span>
                      <span>{formatDate(pago.fechaPago)}</span>
                      <span>
                        {formatCatalogPrice(pago.monto)}
                        {pago.comprobanteArchivo && (
                          <a
                            className="admin-invoice-receipt"
                            href={getInvoiceReceiptUrl(pago.comprobanteArchivo)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Comprobante
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-invoices-sub">Todavía no hay pagos registrados.</p>
              )}
            </section>

            <section className="admin-invoice-block">
              <h4>Gestionar cobro</h4>
              <label className="admin-invoices-field">
                <span>Nuevo estado</span>
                <select
                  value={nuevoEstado}
                  onChange={(event) => setNuevoEstado(event.target.value)}
                >
                  {INVOICE_PAYMENT_STATES.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-invoices-field">
                <span>Observaciones</span>
                <textarea
                  rows={3}
                  maxLength={400}
                  value={observaciones}
                  placeholder="Motivo de la revisión, acuerdo de pago, etc."
                  onChange={(event) => setObservaciones(event.target.value)}
                />
              </label>

              <div className="admin-invoice-detail-actions">
                <button
                  type="button"
                  className="admin-invoice-action secondary"
                  onClick={() => descargarDocumento("factura", detalle)}
                >
                  <FileDown size={15} strokeWidth={1.9} aria-hidden="true" />
                  Descargar factura
                </button>

                <button
                  type="button"
                  className="admin-invoice-action"
                  onClick={guardarEstado}
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cambio"}
                </button>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default AdminInvoices;
