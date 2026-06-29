import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { getBitacora } from "../../services/bitacoraService";
import "./AdminBitacora.css";

// Etiquetas con color por tipo de operación
const OPERACION_BADGE = {
  LOGIN:       { label: "Login",       color: "badge-blue"   },
  LOGIN_SUCCESS: { label: "Login exitoso", color: "badge-blue" },
  LOGIN_FAILED: { label: "Login fallido", color: "badge-red" },
  INSERT:      { label: "Inserción",   color: "badge-green"  },
  UPDATE:      { label: "Actualización", color: "badge-yellow" },
  DELETE:      { label: "Eliminación", color: "badge-red"    },
  ACCESS_DENY: { label: "Acceso denegado", color: "badge-red" },
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

  useEffect(() => {
    loadBitacora();
  }, []);

  const loadBitacora = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBitacora();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la bitácora.");
    } finally {
      setLoading(false);
    }
  };

  const operaciones = useMemo(() => {
    const ops = [...new Set(registros.map((r) => r.operacion).filter(Boolean))];
    return ops;
  }, [registros]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return registros.filter((r) => {
      const matchSearch = [r.correo, r.nombreUsuario, r.tablaAfectada, r.descripcion, r.ipUsuario]
        .join(" ").toLowerCase().includes(term);
      const matchOp = filterOp === "Todos" || r.operacion === filterOp;
      return matchSearch && matchOp;
    });
  }, [registros, searchTerm, filterOp]);

  return (
    <AdminLayout title="Bitácora de Actividad">
      <div className="bitacora-page">

        {/* Topbar */}
        <div className="bitacora-topbar">
          <div className="bitacora-filters">
            <input
              className="bitacora-search"
              type="text"
              placeholder="Buscar por usuario, tabla, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bitacora-op-filter"
              value={filterOp}
              onChange={(e) => setFilterOp(e.target.value)}
            >
              <option value="Todos">Todas las operaciones</option>
              {operaciones.map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
          <button className="bitacora-refresh-btn" onClick={loadBitacora}>
            Actualizar
          </button>
        </div>

        {/* Contador */}
        <p className="bitacora-count">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
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
      </div>
    </AdminLayout>
  );
}

export default AdminBitacora;
