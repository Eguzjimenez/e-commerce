import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { getBitacora } from "../../services/bitacoraService";
import { DEFAULT_PAGINATION, normalizePaginatedResponse } from "../../services/paginationService";
import "./AdminBitacora.css";

const BITACORA_PAGE_SIZE = 50;

// Etiquetas con color por tipo de operación
const OPERACION_BADGE = {
  LOGIN:       { label: "Login",       color: "badge-blue"   },
  LOGIN_SUCCESS: { label: "Login exitoso", color: "badge-blue" },
  LOGIN_FAILED: { label: "Login fallido", color: "badge-red" },
  INSERT:      { label: "Inserción",   color: "badge-green"  },
  UPDATE:      { label: "Actualización", color: "badge-yellow" },
  DELETE:      { label: "Eliminación", color: "badge-red"    },
  ACCESS_DENY: { label: "Acceso denegado", color: "badge-red" },
  DENIED:      { label: "Acceso denegado", color: "badge-red" },
};

function getBadge(operacion) {
  const key = operacion?.toUpperCase();
  return OPERACION_BADGE[key] || { label: operacion, color: "badge-gray" };
}

function formatFecha(fechaStr) {
  if (!fechaStr) return "-";
  const d = new Date(fechaStr);
  return d.toLocaleString("es-CR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function AdminBitacora() {
  const [registros, setRegistros]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterOp, setFilterOp]       = useState("Todos");
  const [bitacoraPage, setBitacoraPage] = useState(1);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: BITACORA_PAGE_SIZE,
  });

  // La consulta espera a que se termine de escribir en vez de salir por tecla.
  const busquedaDiferida = useDebouncedValue(searchTerm);

  useEffect(() => {
    loadBitacora(bitacoraPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitacoraPage, busquedaDiferida, filterOp]);

  const loadBitacora = async (page = bitacoraPage) => {
    setLoading(true);
    setError("");
    try {
      const data = await getBitacora({
        page,
        pageSize: BITACORA_PAGE_SIZE,
        searchTerm: busquedaDiferida,
        operation: filterOp === "Todos" ? undefined : filterOp,
      });
      const pagedBitacora = normalizePaginatedResponse(
        data,
        page,
        BITACORA_PAGE_SIZE
      );

      setRegistros(pagedBitacora.items);
      setPagination(pagedBitacora);
    } catch (err) {
      setError(err.message || "No se pudo cargar la bitácora.");
      setRegistros([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        pageNumber: page,
        pageSize: BITACORA_PAGE_SIZE,
      });
    } finally {
      setLoading(false);
    }
  };

  const operaciones = useMemo(() => {
    return [...new Set([...Object.keys(OPERACION_BADGE), ...registros.map((r) => r.operacion).filter(Boolean)])];
  }, [registros]);

  const filtered = useMemo(() => {
    return registros;
  }, [registros]);

  return (
    <AdminLayout title="Bitácora"
      subtitle="Revisa quién hizo qué y cuándo dentro del sistema.">
      <div className="bitacora-page">

        {/* Topbar */}
        <div className="bitacora-topbar">
          <div className="bitacora-filters">
            <input
              className="bitacora-search"
              type="text"
              placeholder="Buscar por usuario, tabla, descripción..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setBitacoraPage(1);
              }}
            />
            <select
              className="bitacora-op-filter"
              value={filterOp}
              onChange={(e) => {
                setFilterOp(e.target.value);
                setBitacoraPage(1);
              }}
            >
              <option value="Todos">Todas las operaciones</option>
              {operaciones.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <button className="bitacora-refresh-btn" onClick={() => loadBitacora(bitacoraPage)}>
            Actualizar
          </button>
        </div>

        {/* Contador */}
        <p className="bitacora-count">
          {pagination.totalItems} registro{pagination.totalItems !== 1 ? "s" : ""} encontrado{pagination.totalItems !== 1 ? "s" : ""}
        </p>

        {/* Error */}
        {error && <div className="bitacora-error">{error}</div>}

        {/* Tabla */}
        <div className="admin-table-wrapper">
          <table className="bitacora-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha / Hora</th>
                <th>Usuario</th>
                <th>Operación</th>
                <th>Tabla afectada</th>
                <th>Descripción</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-empty-row">Cargando...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-row">No hay registros.</td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const badge = getBadge(r.operacion);
                  return (
                    <tr key={r.idBitacora}>
                      <td className="bitacora-id">{r.idBitacora}</td>
                      <td className="bitacora-fecha">{formatFecha(r.fechaHora)}</td>
                      <td>
                        <span className="bitacora-user">{r.nombreUsuario || r.correo}</span>
                        <span className="bitacora-correo">{r.correo}</span>
                      </td>
                      <td>
                        <span className={`badge ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td>{r.tablaAfectada || "-"}</td>
                      <td className="bitacora-desc">{r.descripcion || "-"}</td>
                      <td className="bitacora-ip">{r.ipUsuario || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && pagination.totalItems > BITACORA_PAGE_SIZE && (
          <PaginationControls
            pagination={pagination}
            isLoading={loading}
            onPageChange={setBitacoraPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBitacora;
