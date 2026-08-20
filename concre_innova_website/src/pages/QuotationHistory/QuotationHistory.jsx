import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import {
  decideQuotation,
  getMyQuotations,
  getQuotationImageUrl,
} from "../../services/quotationService";
import "./QuotationHistory.css";

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  return new Date(value).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status) {
  return String(status || "Pendiente").toLowerCase();
}

function QuotationHistory() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "",
  });
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingDecision, setProcessingDecision] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadQuotations = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getMyQuotations({
          page,
          pageSize: PAGE_SIZE,
          search: appliedFilters.search,
          status: appliedFilters.status,
          signal: controller.signal,
        });
        const nextQuotations = Array.isArray(response?.items)
          ? response.items
          : [];

        setQuotations(nextQuotations);
        setPagination({
          totalPages: Number(response?.totalPages) || 0,
          hasPreviousPage: Boolean(response?.hasPreviousPage),
          hasNextPage: Boolean(response?.hasNextPage),
        });
        setSelectedId((currentId) => {
          const selectionStillExists = nextQuotations.some(
            (quotation) => quotation.idCotizacion === currentId
          );
          return selectionStillExists
            ? currentId
            : nextQuotations[0]?.idCotizacion ?? null;
        });
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "No fue posible consultar las cotizaciones."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadQuotations();
    return () => controller.abort();
  }, [appliedFilters.search, appliedFilters.status, page]);

  const selectedQuotation = useMemo(
    () =>
      quotations.find(
        (quotation) => quotation.idCotizacion === selectedId
      ) || null,
    [quotations, selectedId]
  );

  const handleDecision = async (decision) => {
    if (!selectedQuotation || processingDecision) {
      return;
    }

    const isAcceptance = decision === "Aceptar";
    const confirmation = await Swal.fire({
      icon: "question",
      title: `${decision} cotizacion`,
      text: isAcceptance
        ? "La cotizacion pasara a revision del equipo de ventas."
        : "La cotizacion quedara marcada como rechazada.",
      showCancelButton: true,
      confirmButtonText: decision,
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setProcessingDecision(true);
    try {
      const result = await decideQuotation(
        selectedQuotation.idCotizacion,
        decision
      );

      setQuotations((currentQuotations) =>
        currentQuotations.map((quotation) =>
          quotation.idCotizacion === selectedQuotation.idCotizacion
            ? {
                ...quotation,
                estado: result.estado,
                idPedido: result.idPedido,
                total: result.total,
                historialEstados: [
                  ...(quotation.historialEstados || []),
                  {
                    estadoAnterior: quotation.estado,
                    estadoNuevo: result.estado,
                    fechaCambio: new Date().toISOString(),
                  },
                ],
              }
            : quotation
        )
      );

      const orderSummary = result.idPedido
        ? ` Pedido #${result.idPedido} creado por ${formatCatalogPrice(
            result.total
          )}.`
        : "";
      await Swal.fire({
        icon: "success",
        title: `Cotizacion ${result.estado.toLowerCase()}`,
        text: `${result.mensaje}${orderSummary}`,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar la cotizacion",
        text: error?.message || "Intenta realizar la accion nuevamente.",
      });
    } finally {
      setProcessingDecision(false);
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({
      search: searchInput.trim(),
      status: statusInput,
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("");
    setPage(1);
    setAppliedFilters({ search: "", status: "" });
  };

  const hasActiveFilters =
    Boolean(appliedFilters.search) || Boolean(appliedFilters.status);

  return (
    <main className="quotation-history-page">
      <header className="quotation-history-header">
        <span>Cotizaciones</span>
        <h1>Historial de cotizaciones</h1>
      </header>

      <form
        className="quotation-history-filters"
        onSubmit={handleFilterSubmit}
      >
        <label>
          <span>Buscar cotizaciones</span>
          <input
            type="search"
            maxLength={100}
            placeholder="Número, producto o descripción"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label>
          <span>Estado</span>
          <select
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Respondida">Respondida</option>
            <option value="Aceptada">Aceptada</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </select>
        </label>
        <button type="submit" className="search">
          <Search size={18} aria-hidden="true" />
          Buscar
        </button>
        <button
          type="button"
          className="clear"
          title="Limpiar filtros"
          aria-label="Limpiar filtros"
          onClick={clearFilters}
          disabled={!hasActiveFilters && !searchInput && !statusInput}
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </form>

      {loading && <p className="quotation-history-state">Cargando cotizaciones...</p>}
      {!loading && errorMessage && (
        <p className="quotation-history-state error" role="alert">
          {errorMessage}
        </p>
      )}
      {!loading && !errorMessage && quotations.length === 0 && (
        <p className="quotation-history-state">
          {hasActiveFilters
            ? "No hay cotizaciones que coincidan con los filtros."
            : "Todavia no has enviado solicitudes de cotizacion."}
        </p>
      )}

      {!loading && quotations.length > 0 && (
        <>
          <div className="quotation-history-layout">
            <section className="quotation-history-list" aria-label="Cotizaciones">
              {quotations.map((quotation) => (
                <button
                  type="button"
                  key={quotation.idCotizacion}
                  className={
                    quotation.idCotizacion === selectedId ? "active" : ""
                  }
                  onClick={() => setSelectedId(quotation.idCotizacion)}
                >
                  <span>
                    {quotation.numeroSeguimiento ||
                      `Cotizacion #${quotation.idCotizacion}`}
                  </span>
                  <strong>
                    {formatDate(
                      quotation.fechaRespuesta || quotation.fechaSolicitud
                    )}
                  </strong>
                  <small>{formatCatalogPrice(quotation.total)}</small>
                  <em className={`quotation-history-status ${statusClass(quotation.estado)}`}>
                    {quotation.estado}
                  </em>
                </button>
              ))}
            </section>

            {selectedQuotation && (
              <section className="quotation-history-detail">
                <div className="quotation-history-detail-heading">
                  <div>
                    <span>
                      {selectedQuotation.numeroSeguimiento ||
                        `Solicitud #${selectedQuotation.idCotizacion}`}
                    </span>
                    <h2>
                      {formatDate(
                        selectedQuotation.fechaRespuesta ||
                          selectedQuotation.fechaSolicitud
                      )}
                    </h2>
                  </div>
                  <em
                    className={`quotation-history-status ${statusClass(
                      selectedQuotation.estado
                    )}`}
                  >
                    {selectedQuotation.estado}
                  </em>
                </div>

                <p className="quotation-history-description">
                  {selectedQuotation.descripcion}
                </p>

                {selectedQuotation.preferencias && (
                  <div className="quotation-history-response">
                    <strong>Preferencias solicitadas</strong>
                    <p>{selectedQuotation.preferencias}</p>
                  </div>
                )}

                <div className="quotation-history-products">
                  <h3>Productos solicitados</h3>
                  {selectedQuotation.productosSolicitados?.length > 0 ? (
                    selectedQuotation.productosSolicitados.map((product) => (
                      <div key={product.idProducto}>
                        <span>{product.nombre}</span>
                        <strong>Cantidad: {product.cantidad}</strong>
                      </div>
                    ))
                  ) : (
                    <p>Solicitud anterior sin productos estructurados.</p>
                  )}
                </div>

                {selectedQuotation.imagenes?.length > 0 && (
                  <div className="quotation-history-images">
                    {selectedQuotation.imagenes.map((image) => (
                      <img
                        key={image.rutaArchivo}
                        src={getQuotationImageUrl(image.rutaArchivo)}
                        alt={image.nombreOriginal || "Imagen de referencia"}
                      />
                    ))}
                  </div>
                )}

                {selectedQuotation.respuesta && (
                  <div className="quotation-history-response">
                    <strong>Respuesta</strong>
                    <p>{selectedQuotation.respuesta}</p>
                  </div>
                )}

                <div className="quotation-history-products">
                  <h3>Productos cotizados</h3>
                  {selectedQuotation.productos?.length > 0 ? (
                    selectedQuotation.productos.map((product) => (
                      <div key={product.idProducto}>
                        <span>
                          {product.nombre} x{product.cantidad}
                        </span>
                        <strong>{formatCatalogPrice(product.subtotal)}</strong>
                      </div>
                    ))
                  ) : (
                    <p>Pendiente de respuesta y productos cotizados.</p>
                  )}
                </div>

                <div className="quotation-history-total">
                  <span>Importe total</span>
                  <strong>{formatCatalogPrice(selectedQuotation.total)}</strong>
                </div>

                <div className="quotation-history-timeline">
                  <h3>Historial de estados</h3>
                  {selectedQuotation.historialEstados?.length > 0 ? (
                    <ol>
                      {selectedQuotation.historialEstados.map(
                        (historyEntry, index) => (
                          <li
                            key={`${historyEntry.fechaCambio}-${index}`}
                          >
                            <span
                              className={`quotation-history-timeline-dot ${statusClass(
                                historyEntry.estadoNuevo
                              )}`}
                              aria-hidden="true"
                            />
                            <div>
                              <strong>{historyEntry.estadoNuevo}</strong>
                              <time dateTime={historyEntry.fechaCambio}>
                                {formatDate(historyEntry.fechaCambio)}
                              </time>
                              {historyEntry.estadoAnterior && (
                                <small>
                                  Cambio desde {historyEntry.estadoAnterior}
                                </small>
                              )}
                            </div>
                          </li>
                        )
                      )}
                    </ol>
                  ) : (
                    <p>No hay cambios de estado registrados.</p>
                  )}
                </div>

                {selectedQuotation.idPedido && (
                  <p className="quotation-history-order">
                    Pedido asociado: #{selectedQuotation.idPedido}
                  </p>
                )}

                {selectedQuotation.estado === "Respondida" && (
                  <div className="quotation-history-actions">
                    <button
                      type="button"
                      className="accept"
                      onClick={() => handleDecision("Aceptar")}
                      disabled={processingDecision}
                    >
                      <Check size={18} aria-hidden="true" />
                      Aceptar cotización
                    </button>
                    <button
                      type="button"
                      className="reject"
                      onClick={() => handleDecision("Rechazar")}
                      disabled={processingDecision}
                    >
                      <X size={18} aria-hidden="true" />
                      Rechazar cotización
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="quotation-history-pagination" aria-label="Paginación">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                Pagina {page} de {pagination.totalPages}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

export default QuotationHistory;
