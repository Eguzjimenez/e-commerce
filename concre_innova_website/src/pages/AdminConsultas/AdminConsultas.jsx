import "./AdminConsultas.css";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import Modal from "../../components/Modal/Modal";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import {
  CONSULTAS_PAGE_SIZE,
  CONSULTA_ESTADOS,
  getConsultas,
  responderConsulta,
} from "../../services/consultaService";
import { DEFAULT_PAGINATION, normalizePaginatedResponse } from "../../services/paginationService";

const FILTROS = [
  { id: "", label: "Todas" },
  { id: CONSULTA_ESTADOS.NUEVO, label: "Pendientes" },
  { id: CONSULTA_ESTADOS.RESPONDIDO, label: "Respondidas" },
];

function formatearFecha(valor) {
  if (!valor) {
    return "";
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? ""
    : fecha.toLocaleString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function AdminConsultas() {
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: CONSULTAS_PAGE_SIZE,
  });
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargarConsultas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuestaApi = await getConsultas({
        estado: filtro,
        pagina,
        tamanoPagina: CONSULTAS_PAGE_SIZE,
      });

      setPagination(normalizePaginatedResponse(respuestaApi, pagina, CONSULTAS_PAGE_SIZE));
    } catch (errorCarga) {
      setError(errorCarga.message || "No se pudieron cargar las consultas.");
      setPagination({
        ...DEFAULT_PAGINATION,
        pageNumber: pagina,
        pageSize: CONSULTAS_PAGE_SIZE,
      });
    } finally {
      setCargando(false);
    }
  }, [filtro, pagina]);

  useEffect(() => {
    cargarConsultas();
  }, [cargarConsultas]);

  const abrirRespuesta = (consulta) => {
    setConsultaSeleccionada(consulta);
    setRespuesta(consulta.respuesta || "");
  };

  const cerrarRespuesta = () => {
    if (!enviando) {
      setConsultaSeleccionada(null);
      setRespuesta("");
    }
  };

  const enviarRespuesta = async (evento) => {
    evento.preventDefault();

    if (enviando) {
      return;
    }

    setEnviando(true);

    try {
      const resultado = await responderConsulta(consultaSeleccionada.idMensaje, respuesta);

      if (resultado?.codigo !== 1) {
        throw new Error(resultado?.mensaje || "No se pudo registrar la respuesta.");
      }

      setConsultaSeleccionada(null);
      setRespuesta("");

      await Swal.fire({
        icon: "success",
        title: "Consulta respondida",
        text: "La respuesta se registro y se envio al cliente por correo.",
        timer: 1900,
        showConfirmButton: false,
      });

      await cargarConsultas();
    } catch (errorEnvio) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo responder",
        text: errorEnvio.message || "Intenta nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AdminLayout title="Consultas de clientes">
      <div className="consultas-page">
        <div className="consultas-toolbar">
          <div className="consultas-filtros" role="tablist" aria-label="Estado de la consulta">
            {FILTROS.map((opcion) => (
              <button
                key={opcion.label}
                type="button"
                role="tab"
                aria-selected={filtro === opcion.id}
                className={filtro === opcion.id ? "active" : ""}
                onClick={() => {
                  setFiltro(opcion.id);
                  setPagina(1);
                }}
                disabled={cargando}
              >
                {opcion.label}
              </button>
            ))}
          </div>

          <p className="consultas-total">
            {pagination.totalItems} consulta{pagination.totalItems !== 1 ? "s" : ""}
          </p>
        </div>

        {cargando && <p className="consultas-estado">Cargando consultas...</p>}
        {!cargando && error && <p className="consultas-estado error">{error}</p>}

        {!cargando && !error && pagination.items.length === 0 && (
          <p className="consultas-estado">No hay consultas para este filtro.</p>
        )}

        {!cargando && !error && pagination.items.length > 0 && (
          <div className="consultas-tabla-wrap">
            <table className="consultas-tabla">
              <caption className="sr-only">Consultas enviadas desde el formulario de contacto</caption>
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Asunto</th>
                  <th scope="col">Recibida</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Accion</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.map((consulta) => (
                  <tr key={consulta.idMensaje}>
                    <td>
                      <strong>{consulta.nombre}</strong>
                      <span className="consultas-contacto">{consulta.correo}</span>
                      {consulta.telefono && (
                        <span className="consultas-contacto">{consulta.telefono}</span>
                      )}
                    </td>
                    <td>
                      <strong>{consulta.asunto}</strong>
                      <span className="consultas-mensaje">{consulta.mensaje}</span>
                    </td>
                    <td>{formatearFecha(consulta.fechaEnvio)}</td>
                    <td>
                      <span
                        className={
                          consulta.estado === CONSULTA_ESTADOS.RESPONDIDO
                            ? "consultas-badge respondido"
                            : "consultas-badge pendiente"
                        }
                      >
                        {consulta.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="consultas-accion"
                        onClick={() => abrirRespuesta(consulta)}
                      >
                        {consulta.estado === CONSULTA_ESTADOS.RESPONDIDO ? "Ver respuesta" : "Responder"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && !error && pagination.totalPages > 1 && (
          <PaginationControls
            pagination={pagination}
            onPageChange={setPagina}
            isLoading={cargando}
          />
        )}

        <Modal
          open={Boolean(consultaSeleccionada)}
          onClose={cerrarRespuesta}
          closeOnBackdrop={!enviando}
          title={consultaSeleccionada ? `Consulta: ${consultaSeleccionada.asunto}` : "Consulta"}
        >
          {consultaSeleccionada && (
            <form className="consultas-form" onSubmit={enviarRespuesta}>
              <div className="consultas-detalle">
                <p>
                  <strong>De:</strong> {consultaSeleccionada.nombre} ({consultaSeleccionada.correo})
                </p>
                <p>
                  <strong>Recibida:</strong> {formatearFecha(consultaSeleccionada.fechaEnvio)}
                </p>
                <p className="consultas-detalle-mensaje">{consultaSeleccionada.mensaje}</p>
              </div>

              {consultaSeleccionada.fechaRespuesta && (
                <p className="consultas-respondida">
                  Respondida el {formatearFecha(consultaSeleccionada.fechaRespuesta)}
                </p>
              )}

              <label className="consultas-campo">
                <span>Respuesta para el cliente</span>
                <textarea
                  value={respuesta}
                  onChange={(evento) => setRespuesta(evento.target.value)}
                  rows={6}
                  maxLength={2000}
                  minLength={10}
                  required
                  disabled={enviando}
                  placeholder="Escribe la respuesta que se enviara por correo"
                />
              </label>

              <div className="consultas-form-acciones">
                <button
                  type="button"
                  className="consultas-accion secundaria"
                  onClick={cerrarRespuesta}
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button type="submit" className="consultas-accion" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar respuesta"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default AdminConsultas;
