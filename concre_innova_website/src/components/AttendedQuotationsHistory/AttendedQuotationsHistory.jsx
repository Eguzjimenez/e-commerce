import { useEffect, useState } from "react";
import PaginationControls from "../PaginationControls/PaginationControls";
import { getAdminQuotations } from "../../services/quotationService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import {
  DEFAULT_PAGINATION,
  normalizePaginatedResponse,
} from "../../services/paginationService";
import "./AttendedQuotationsHistory.css";

const HISTORY_PAGE_SIZE = 10;

function formatHistoryDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : date.toLocaleDateString("es-CR");
}

function statusClass(status) {
  return String(status || "Pendiente").toLowerCase();
}

/**
 * Historial de cotizaciones ya gestionadas por el equipo de ventas,
 * ordenadas de la mas reciente a la mas antigua por el API.
 */
function AttendedQuotationsHistory() {
  const [page, setPage] = useState(1);
  const [quotations, setQuotations] = useState([]);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: HISTORY_PAGE_SIZE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadHandledQuotations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getAdminQuotations({
          page,
          pageSize: HISTORY_PAGE_SIZE,
          onlyHandled: true,
          signal: controller.signal,
        });
        const normalized = normalizePaginatedResponse(
          response,
          page,
          HISTORY_PAGE_SIZE
        );

        setQuotations(normalized.items);
        setPagination(normalized);
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "No fue posible cargar el historial de cotizaciones."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadHandledQuotations();
    return () => controller.abort();
  }, [page]);

  return (
    <section className="quotation-history-panel">
      <div className="quotation-history-header">
        <h2>Historial de cotizaciones atendidas</h2>
        <p>
          Cotizaciones respondidas, aceptadas, aprobadas y rechazadas, de la mas
          reciente a la mas antigua.
        </p>
      </div>

      {isLoading && <p className="admin-quotation-state">Cargando historial...</p>}

      {!isLoading && errorMessage && (
        <p className="admin-quotation-state error">{errorMessage}</p>
      )}

      {!isLoading && !errorMessage && quotations.length === 0 && (
        <p className="admin-quotation-state">
          Todavia no hay cotizaciones gestionadas.
        </p>
      )}

      {!isLoading && !errorMessage && quotations.length > 0 && (
        <>
          <div className="quotation-history-table-wrapper">
            <table className="quotation-history-table">
              <caption className="quotation-history-caption">
                {pagination.totalItems} cotizacion(es) gestionada(s)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Solicitud</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Fecha de solicitud</th>
                  <th scope="col">Fecha de respuesta</th>
                  <th scope="col">Estado final</th>
                  <th scope="col">Monto</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.idCotizacion}>
                    <td>
                      {quotation.numeroSeguimiento ||
                        `#${quotation.idCotizacion}`}
                    </td>
                    <td>{quotation.cliente}</td>
                    <td>{formatHistoryDate(quotation.fechaSolicitud)}</td>
                    <td>{formatHistoryDate(quotation.fechaRespuesta)}</td>
                    <td>
                      <span
                        className={`quotation-status ${statusClass(
                          quotation.estado
                        )}`}
                      >
                        {quotation.estado}
                      </span>
                    </td>
                    <td>
                      {Number(quotation.total) > 0
                        ? formatCatalogPrice(quotation.total)
                        : "Sin monto"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            pagination={pagination}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </>
      )}
    </section>
  );
}

export default AttendedQuotationsHistory;
