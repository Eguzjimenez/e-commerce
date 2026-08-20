import "./AdminQuotations.css";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Images,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import AttendedQuotationsHistory from "../../components/AttendedQuotationsHistory/AttendedQuotationsHistory";
import { getCatalogProducts } from "../../services/catalogService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import {
  convertQuotationToOrder,
  getAdminQuotations,
  getQuotationImageUrl,
  resolveQuotation,
  respondQuotation,
} from "../../services/quotationService";

const PAGE_SIZE = 20;

const QUOTATION_VIEWS = {
  REQUESTS: "solicitudes",
  HISTORY: "historial",
};

function describeRequestedProducts(requestedProducts) {
  return (Array.isArray(requestedProducts) ? requestedProducts : [])
    .map((product) => `${product.nombre} x${product.cantidad}`)
    .join(", ");
}

function getItems(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response?.items) ? response.items : [];
}

function normalizeProduct(product) {
  return {
    idProducto: Number(product.idProducto ?? product.id),
    nombre: product.nombre ?? product.name ?? "Producto",
    precio: Number(product.precio ?? product.price) || 0,
  };
}

function createOfferRow(product) {
  return {
    idProducto: product?.idProducto || "",
    cantidad: 1,
    precioUnitario: product?.precio || "",
  };
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString("es-CR")
    : "Sin fecha";
}

function statusClass(status) {
  return String(status || "Pendiente").toLowerCase();
}

function AdminQuotations() {
  const [activeView, setActiveView] = useState(QUOTATION_VIEWS.REQUESTS);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "",
  });
  const [quotations, setQuotations] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [offerRows, setOfferRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pagination, setPagination] = useState({
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const selectQuotation = (quotation, availableProducts = products) => {
    setSelectedId(quotation?.idCotizacion ?? null);
    setResponseText(quotation?.respuesta || "");

    const existingProducts = Array.isArray(quotation?.productos)
      ? quotation.productos.map((product) => ({
          idProducto: product.idProducto,
          cantidad: product.cantidad,
          precioUnitario: product.precioUnitario,
        }))
      : [];
    const requestedProducts = Array.isArray(
      quotation?.productosSolicitados
    )
      ? quotation.productosSolicitados.map((requestedProduct) => {
          const catalogProduct = availableProducts.find(
            (product) =>
              product.idProducto === requestedProduct.idProducto
          );
          return {
            idProducto: requestedProduct.idProducto,
            cantidad: requestedProduct.cantidad,
            precioUnitario: catalogProduct?.precio || "",
          };
        })
      : [];
    setOfferRows(
      existingProducts.length > 0
        ? existingProducts
        : requestedProducts.length > 0
        ? requestedProducts
        : [createOfferRow(availableProducts[0])]
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [quotationResponse, productResponse] = await Promise.all([
          getAdminQuotations({
            page,
            pageSize: PAGE_SIZE,
            search: appliedFilters.search,
            status: appliedFilters.status,
            signal: controller.signal,
          }),
          getCatalogProducts({
            page: 1,
            pageSize: 100,
            signal: controller.signal,
          }),
        ]);
        const nextProducts = getItems(productResponse)
          .map(normalizeProduct)
          .filter((product) => product.idProducto > 0);
        const nextQuotations = getItems(quotationResponse);

        setProducts(nextProducts);
        setQuotations(nextQuotations);
        setPagination({
          totalPages: Number(quotationResponse?.totalPages) || 0,
          hasPreviousPage: Boolean(quotationResponse?.hasPreviousPage),
          hasNextPage: Boolean(quotationResponse?.hasNextPage),
        });
        selectQuotation(nextQuotations[0], nextProducts);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "No fue posible cargar las cotizaciones."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => controller.abort();
    // selectQuotation only synchronizes form state with this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters.search, appliedFilters.status, page]);

  const selectedQuotation = useMemo(
    () =>
      quotations.find(
        (quotation) => quotation.idCotizacion === selectedId
      ) || null,
    [quotations, selectedId]
  );
  const canRespond = ["Pendiente", "Respondida"].includes(
    selectedQuotation?.estado
  );
  const canResolve = selectedQuotation?.estado === "Aceptada";
  const canConvert =
    selectedQuotation?.estado === "Aprobada" &&
    !selectedQuotation?.idPedido;

  const offerTotal = useMemo(
    () =>
      offerRows.reduce(
        (total, row) =>
          total +
          (Number(row.cantidad) || 0) *
            (Number(row.precioUnitario) || 0),
        0
      ),
    [offerRows]
  );

  const updateOfferRow = (index, field, value) => {
    setOfferRows((currentRows) =>
      currentRows.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        if (field !== "idProducto") {
          return { ...row, [field]: value };
        }

        const selectedProduct = products.find(
          (product) => product.idProducto === Number(value)
        );
        return {
          ...row,
          idProducto: value,
          precioUnitario: selectedProduct?.precio || row.precioUnitario,
        };
      })
    );
  };

  const removeOfferRow = (index) => {
    setOfferRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedQuotation || submitting) {
      return;
    }

    const normalizedProducts = offerRows.map((row) => ({
      idProducto: Number(row.idProducto),
      cantidad: Number(row.cantidad),
      precioUnitario: Number(row.precioUnitario),
    }));

    setSubmitting(true);
    try {
      const result = await respondQuotation(selectedQuotation.idCotizacion, {
        respuesta: responseText,
        productos: normalizedProducts,
      });

      setQuotations((currentQuotations) =>
        currentQuotations.map((quotation) =>
          quotation.idCotizacion === selectedQuotation.idCotizacion
            ? {
                ...quotation,
                estado: result.estado,
                total: result.total,
                respuesta: responseText.trim(),
                fechaRespuesta: new Date().toISOString(),
                historialEstados:
                  quotation.estado === result.estado
                    ? quotation.historialEstados
                    : [
                        ...(quotation.historialEstados || []),
                        {
                          estadoAnterior: quotation.estado,
                          estadoNuevo: result.estado,
                          fechaCambio: new Date().toISOString(),
                        },
                      ],
                productos: normalizedProducts.map((item) => {
                  const product = products.find(
                    (candidate) =>
                      candidate.idProducto === item.idProducto
                  );
                  return {
                    ...item,
                    nombre: product?.nombre || "Producto",
                    subtotal: item.cantidad * item.precioUnitario,
                  };
                }),
              }
            : quotation
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Cotizacion respondida",
        text: `Importe enviado: ${formatCatalogPrice(result.total)}.`,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo responder",
        text: error?.message || "Revisa los productos y vuelve a intentar.",
      });
    } finally {
      setSubmitting(false);
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

  const handleSellerDecision = async (decision) => {
    if (!selectedQuotation || !canResolve || submitting) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: `${decision} cotizacion`,
      text:
        decision === "Aprobar"
          ? "La cotizacion quedara habilitada para convertirse en pedido."
          : "La cotizacion quedara cerrada como rechazada.",
      showCancelButton: true,
      confirmButtonText: decision,
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await resolveQuotation(
        selectedQuotation.idCotizacion,
        decision
      );

      setQuotations((currentQuotations) =>
        currentQuotations.map((quotation) =>
          quotation.idCotizacion === selectedQuotation.idCotizacion
            ? {
                ...quotation,
                estado: result.estado,
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

      await Swal.fire({
        icon: "success",
        title: `Cotizacion ${result.estado.toLowerCase()}`,
        text: result.mensaje,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo resolver la cotizacion",
        text: error?.message || "Intenta realizar la accion nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderConversion = async () => {
    if (!selectedQuotation || !canConvert || submitting) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Convertir en pedido",
      text: "Se validara el stock y se creara el pedido formal.",
      showCancelButton: true,
      confirmButtonText: "Convertir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await convertQuotationToOrder(
        selectedQuotation.idCotizacion
      );

      setQuotations((currentQuotations) =>
        currentQuotations.map((quotation) =>
          quotation.idCotizacion === selectedQuotation.idCotizacion
            ? {
                ...quotation,
                idPedido: result.idPedido,
                total: result.total,
              }
            : quotation
        )
      );

      await Swal.fire({
        icon: "success",
        title: "Pedido creado",
        text: `Pedido #${result.idPedido} creado por ${formatCatalogPrice(
          result.total
        )}.`,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo crear el pedido",
        text: error?.message || "Verifica el stock y vuelve a intentar.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasActiveFilters =
    Boolean(appliedFilters.search) || Boolean(appliedFilters.status);

  return (
    <AdminLayout title="Atención de Cotizaciones">
      <div className="admin-quotations-views" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === QUOTATION_VIEWS.REQUESTS}
          className={activeView === QUOTATION_VIEWS.REQUESTS ? "active" : ""}
          onClick={() => setActiveView(QUOTATION_VIEWS.REQUESTS)}
        >
          Solicitudes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === QUOTATION_VIEWS.HISTORY}
          className={activeView === QUOTATION_VIEWS.HISTORY ? "active" : ""}
          onClick={() => setActiveView(QUOTATION_VIEWS.HISTORY)}
        >
          Historial
        </button>
      </div>

      {activeView === QUOTATION_VIEWS.HISTORY && <AttendedQuotationsHistory />}

      <div
        className="admin-quotations-page"
        hidden={activeView !== QUOTATION_VIEWS.REQUESTS}
      >
        <section className="admin-quotations-list">
          <div className="admin-quotations-list-header">
            <h2>Solicitudes recibidas</h2>
            <p>Atiende solicitudes y consulta el historial de negociaciones.</p>
          </div>

          <form
            className="admin-quotation-filters"
            onSubmit={handleFilterSubmit}
          >
            <input
              type="search"
              maxLength={100}
              aria-label="Buscar cotizaciones"
              placeholder="Seguimiento, cliente o producto"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              aria-label="Filtrar por estado"
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Respondida">Respondida</option>
              <option value="Aceptada">Aceptada por cliente</option>
              <option value="Aprobada">Aprobada por ventas</option>
              <option value="Rechazada">Rechazada</option>
            </select>
            <div>
              <button type="submit" title="Buscar">
                <Search size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="Limpiar filtros"
                onClick={clearFilters}
                disabled={!hasActiveFilters && !searchInput && !statusInput}
              >
                <RotateCcw size={17} aria-hidden="true" />
              </button>
            </div>
          </form>

          {loading && <p className="admin-quotation-state">Cargando...</p>}
          {!loading && errorMessage && (
            <p className="admin-quotation-state error">{errorMessage}</p>
          )}
          {!loading && !errorMessage && quotations.length === 0 && (
            <p className="admin-quotation-state">
              {hasActiveFilters
                ? "No hay cotizaciones que coincidan con los filtros."
                : "No hay solicitudes registradas."}
            </p>
          )}

          <div className="admin-quotation-items">
            {quotations.map((quotation) => (
              <button
                type="button"
                key={quotation.idCotizacion}
                className={`admin-quotation-item ${
                  selectedId === quotation.idCotizacion ? "active" : ""
                }`}
                onClick={() => selectQuotation(quotation)}
              >
                <div className="admin-quotation-item-top">
                  <h3>{quotation.cliente}</h3>
                  <span
                    className={`quotation-status ${statusClass(
                      quotation.estado
                    )}`}
                  >
                    {quotation.estado}
                  </span>
                </div>
                <p className="admin-quotation-date">
                  {quotation.numeroSeguimiento || `#${quotation.idCotizacion}`}{" "}
                  | Solicitud: {formatDate(quotation.fechaSolicitud)}
                </p>
                {quotation.fechaRespuesta && (
                  <p className="admin-quotation-date">
                    Respuesta: {formatDate(quotation.fechaRespuesta)}
                  </p>
                )}
                <p className="admin-quotation-summary">
                  {quotation.descripcion}
                </p>
                {quotation.productosSolicitados?.length > 0 && (
                  <p className="admin-quotation-requested">
                    Productos solicitados:{" "}
                    {describeRequestedProducts(quotation.productosSolicitados)}
                  </p>
                )}
                {quotation.imagenes?.length > 0 && (
                  <p className="admin-quotation-attachments">
                    <Images size={15} aria-hidden="true" />
                    {quotation.imagenes.length} imagen(es) adjunta(s)
                  </p>
                )}
                <strong className="admin-quotation-amount">
                  {formatCatalogPrice(quotation.total)}
                </strong>
              </button>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="admin-quotation-pagination">
              <button
                type="button"
                title="Página anterior"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                title="Página siguiente"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </section>

        {selectedQuotation && (
          <form className="admin-quotation-detail" onSubmit={handleSubmit}>
            <div className="admin-quotation-detail-header">
              <h2>Detalle de cotización</h2>
              <span
                className={`quotation-status ${statusClass(
                  selectedQuotation.estado
                )}`}
              >
                {selectedQuotation.estado}
              </span>
            </div>

            <div className="admin-quotation-info">
              <p>
                <strong>Cliente:</strong> {selectedQuotation.cliente}
              </p>
              <p>
                <strong>Seguimiento:</strong>{" "}
                {selectedQuotation.numeroSeguimiento ||
                  `#${selectedQuotation.idCotizacion}`}
              </p>
              <p>
                <strong>Fecha de solicitud:</strong>{" "}
                {formatDate(selectedQuotation.fechaSolicitud)}
              </p>
              <p>
                <strong>Fecha de respuesta:</strong>{" "}
                {formatDate(selectedQuotation.fechaRespuesta)}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {selectedQuotation.descripcion}
              </p>
              <p>
                <strong>Preferencias:</strong>{" "}
                {selectedQuotation.preferencias || "No registradas"}
              </p>
            </div>

            <div className="admin-quotation-history">
              <h3>Historial de estados</h3>
              {selectedQuotation.historialEstados?.length > 0 ? (
                <ol>
                  {selectedQuotation.historialEstados.map((entry, index) => (
                    <li key={`${entry.fechaCambio}-${index}`}>
                      <span
                        className={`quotation-status ${statusClass(
                          entry.estadoNuevo
                        )}`}
                      >
                        {entry.estadoNuevo}
                      </span>
                      <time dateTime={entry.fechaCambio}>
                        {formatDate(entry.fechaCambio)}
                      </time>
                      {entry.estadoAnterior && (
                        <small>Desde {entry.estadoAnterior}</small>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No hay cambios de estado registrados.</p>
              )}
            </div>

            {selectedQuotation.productosSolicitados?.length > 0 && (
              <div className="admin-quotation-products">
                <h3>Productos solicitados</h3>
                <ul>
                  {selectedQuotation.productosSolicitados.map((product) => (
                    <li key={product.idProducto}>
                      {product.nombre} x{product.cantidad}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedQuotation.imagenes?.length > 0 && (
              <div className="admin-quotation-images">
                {selectedQuotation.imagenes.map((image) => (
                  <img
                    key={image.rutaArchivo}
                    src={getQuotationImageUrl(image.rutaArchivo)}
                    alt={image.nombreOriginal || "Referencia del cliente"}
                  />
                ))}
              </div>
            )}

            <div className="admin-quotation-products">
              <div className="admin-quotation-section-heading">
                <h3>Productos ofrecidos</h3>
                <button
                  type="button"
                  title="Agregar producto"
                  onClick={() =>
                    setOfferRows((currentRows) => [
                      ...currentRows,
                      createOfferRow(products[0]),
                    ])
                  }
                  disabled={!canRespond || submitting || offerRows.length >= 50}
                >
                  <Plus size={17} />
                </button>
              </div>

              <div className="admin-quotation-offer-list">
                {offerRows.map((row, index) => (
                  <div
                    className="admin-quotation-offer-row"
                    key={`${index}-${row.idProducto}`}
                  >
                    <select
                      aria-label={`Producto ${index + 1}`}
                      value={row.idProducto}
                      required
                      onChange={(event) =>
                        updateOfferRow(
                          index,
                          "idProducto",
                          event.target.value
                        )
                      }
                      disabled={!canRespond || submitting}
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((product) => (
                        <option
                          key={product.idProducto}
                          value={product.idProducto}
                        >
                          {product.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      required
                      aria-label={`Cantidad ${index + 1}`}
                      value={row.cantidad}
                      onChange={(event) =>
                        updateOfferRow(index, "cantidad", event.target.value)
                      }
                      disabled={!canRespond || submitting}
                    />
                    <input
                      type="number"
                      min="0.01"
                      max="99999999.99"
                      step="0.01"
                      required
                      aria-label={`Precio ${index + 1}`}
                      value={row.precioUnitario}
                      onChange={(event) =>
                        updateOfferRow(
                          index,
                          "precioUnitario",
                          event.target.value
                        )
                      }
                      disabled={!canRespond || submitting}
                    />
                    <button
                      type="button"
                      title="Eliminar producto"
                      aria-label={`Eliminar producto ${index + 1}`}
                      onClick={() => removeOfferRow(index)}
                      disabled={
                        !canRespond || submitting || offerRows.length === 1
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="admin-quotation-offer-total">
                Total: <strong>{formatCatalogPrice(offerTotal)}</strong>
              </p>
            </div>

            <div className="admin-quotation-response">
              <label htmlFor="respuestaCotizacion">Respuesta al cliente</label>
              <textarea
                id="respuestaCotizacion"
                maxLength={1000}
                required
                placeholder="Detalla condiciones, disponibilidad y vigencia de la oferta."
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                disabled={!canRespond || submitting}
              />
            </div>

            <div className="admin-quotation-actions">
              {canRespond && (
                <button
                  className="admin-primary-button"
                  type="submit"
                  disabled={submitting || offerRows.length === 0}
                >
                  <Send size={17} />
                  {submitting ? "Enviando..." : "Enviar respuesta"}
                </button>
              )}
              {canResolve && (
                <>
                  <button
                    className="admin-primary-button approve"
                    type="button"
                    onClick={() => handleSellerDecision("Aprobar")}
                    disabled={submitting}
                  >
                    <CheckCircle2 size={17} />
                    Aprobar cotización
                  </button>
                  <button
                    className="admin-secondary-button reject"
                    type="button"
                    onClick={() => handleSellerDecision("Rechazar")}
                    disabled={submitting}
                  >
                    <XCircle size={17} />
                    Rechazar cotización
                  </button>
                </>
              )}
              {canConvert && (
                <button
                  className="admin-primary-button convert"
                  type="button"
                  onClick={handleOrderConversion}
                  disabled={submitting}
                >
                  <ShoppingCart size={17} />
                  Convertir en pedido
                </button>
              )}
            </div>
            {selectedQuotation.idPedido && (
              <p className="admin-quotation-order">
                Pedido formal asociado: #{selectedQuotation.idPedido}
              </p>
            )}
            {!canRespond && !canResolve && !canConvert && !selectedQuotation.idPedido && (
              <p className="admin-quotation-state">
                No hay acciones pendientes para esta cotización.
              </p>
            )}
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminQuotations;
