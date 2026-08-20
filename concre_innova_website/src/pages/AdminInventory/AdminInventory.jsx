import "./AdminInventory.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Eye, PackageSearch, Pencil, RefreshCw, TriangleAlert } from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import Modal from "../../components/Modal/Modal";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getCatalogCategories } from "../../services/catalogService";
import {
  formatCatalogPrice,
  getCatalogProductImage,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";
import { DEFAULT_PAGINATION } from "../../services/paginationService";
import {
  INVENTORY_PAGE_SIZE,
  INVENTORY_STATUS,
  INVENTORY_STATUS_FILTERS,
  getInventory,
  getInventoryAdjustmentError,
  getInventoryDetail,
  getInventoryStatusLabel,
  updateInventory,
} from "../../services/inventoryService";

const STATUS_CLASS = {
  [INVENTORY_STATUS.AVAILABLE]: "status-available",
  [INVENTORY_STATUS.LOW]: "status-low",
  [INVENTORY_STATUS.OUT]: "status-out",
};

function formatDate(value) {
  if (!value) {
    return "Sin registro";
  }

  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime())
    ? "Sin registro"
    : fecha.toLocaleString("es-CR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function AdminInventory() {
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: INVENTORY_PAGE_SIZE,
  });
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ cantidadDisponible: 0, cantidadMinima: 0 });
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const guardadoEnCurso = useRef(false);

  // La consulta espera a que se termine de escribir en vez de salir por tecla.
  const busquedaDiferida = useDebouncedValue(searchTerm);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getInventory({
        searchTerm: busquedaDiferida,
        categoryId: selectedCategory || undefined,
        status: selectedStatus,
        page,
        pageSize: INVENTORY_PAGE_SIZE,
      });

      setPagination(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el inventario.");
      setPagination({ ...DEFAULT_PAGINATION, pageSize: INVENTORY_PAGE_SIZE });
    } finally {
      setLoading(false);
    }
  }, [busquedaDiferida, selectedCategory, selectedStatus, page]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    getCatalogCategories()
      .then((response) => setCategories(Array.isArray(response) ? response : []))
      .catch(() => setCategories([]));
  }, []);

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categories),
    [categories]
  );

  const resumen = useMemo(() => {
    const items = pagination.items || [];

    return {
      bajos: items.filter((item) => item.estadoExistencias === INVENTORY_STATUS.LOW).length,
      agotados: items.filter((item) => item.estadoExistencias === INVENTORY_STATUS.OUT).length,
    };
  }, [pagination.items]);

  const cambiarFiltro = (accion) => {
    accion();
    setPage(1);
  };

  const abrirAjuste = (item) => {
    setAdjustTarget(item);
    setAdjustForm({
      cantidadDisponible: item.cantidadDisponible ?? 0,
      cantidadMinima: item.cantidadMinima ?? 0,
    });
  };

  const cerrarAjuste = () => {
    if (!saving) {
      setAdjustTarget(null);
    }
  };

  const guardarAjuste = async (event) => {
    event.preventDefault();

    const mensaje = getInventoryAdjustmentError(adjustForm);

    if (mensaje) {
      await Swal.fire({ icon: "warning", title: "Revisa las cantidades", text: mensaje });
      return;
    }

    // Guardia sincrónica: un doble clic no debe registrar dos ajustes.
    if (guardadoEnCurso.current) {
      return;
    }

    guardadoEnCurso.current = true;
    setSaving(true);

    try {
      const resultado = await updateInventory(adjustTarget.idProducto, adjustForm);

      setAdjustTarget(null);
      await Swal.fire({
        icon: "success",
        title: "Existencias actualizadas",
        text: resultado?.mensaje || "El inventario quedó actualizado.",
        timer: 1700,
        showConfirmButton: false,
      });

      await loadInventory();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: saveError.message || "Error al ajustar las existencias.",
      });
    } finally {
      guardadoEnCurso.current = false;
      setSaving(false);
    }
  };

  const abrirDetalle = async (item) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);

    try {
      setDetail(await getInventoryDetail(item.idProducto));
    } catch (detailError) {
      setDetailOpen(false);
      await Swal.fire({
        icon: "error",
        title: "No se pudo abrir el detalle",
        text: detailError.message || "Error al consultar el producto.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const items = pagination.items || [];

  return (
    <AdminLayout
      title="Inventario"
      subtitle="Consulta las existencias, ajusta el mínimo y detecta lo que hay que reponer."
    >
      <div className="admin-inventory-page">
        <div className="admin-inventory-topbar">
          <div className="admin-inventory-filters">
            <label className="admin-inventory-field">
              <span>Buscar producto</span>
              <input
                type="search"
                placeholder="Nombre del producto"
                value={searchTerm}
                onChange={(event) => cambiarFiltro(() => setSearchTerm(event.target.value))}
                className="admin-inventory-search"
              />
            </label>

            <label className="admin-inventory-field">
              <span>Categoría</span>
              <select
                value={selectedCategory}
                onChange={(event) => cambiarFiltro(() => setSelectedCategory(event.target.value))}
                className="admin-inventory-select"
              >
                <option value="">Todas</option>
                {normalizedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-inventory-field">
              <span>Estado</span>
              <select
                value={selectedStatus}
                onChange={(event) => cambiarFiltro(() => setSelectedStatus(event.target.value))}
                className="admin-inventory-select"
              >
                {INVENTORY_STATUS_FILTERS.map((filtro) => (
                  <option key={filtro.value || "todos"} value={filtro.value}>
                    {filtro.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-inventory-topbar-actions">
            <button
              type="button"
              className="admin-inventory-btn"
              onClick={() => cambiarFiltro(() => setSelectedStatus(INVENTORY_STATUS.LOW))}
            >
              <TriangleAlert size={16} strokeWidth={1.9} aria-hidden="true" />
              Ver por reponer
            </button>

            <button
              type="button"
              className="admin-inventory-btn"
              onClick={loadInventory}
              disabled={loading}
            >
              <RefreshCw size={16} strokeWidth={1.9} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </div>

        {(resumen.bajos > 0 || resumen.agotados > 0) && (
          <p className="admin-inventory-summary" role="status">
            En esta página hay {resumen.agotados} producto(s) agotado(s) y {resumen.bajos} bajo
            el mínimo.
          </p>
        )}

        {error && <div className="admin-products-error">{error}</div>}

        {loading && <p className="admin-inventory-state">Cargando inventario...</p>}

        {!loading && !error && items.length === 0 && (
          <p className="admin-inventory-state">
            No se encontraron productos con los filtros seleccionados.
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <>
            <div className="admin-table-wrapper admin-inventory-table-wrapper">
              <table className="admin-inventory-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="admin-inventory-numeric">Disponible</th>
                    <th className="admin-inventory-numeric">Mínimo</th>
                    <th>Estado</th>
                    <th>Último ajuste</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.idProducto}>
                      <td className="admin-inventory-name">
                        <strong>{item.nombre}</strong>
                        {item.estadoProducto !== "Activo" && (
                          <span className="admin-inventory-tag">{item.estadoProducto}</span>
                        )}
                      </td>
                      <td>{item.nombreCategoria || "Sin categoría"}</td>
                      <td className="admin-inventory-numeric">
                        <strong>{item.cantidadDisponible}</strong>
                      </td>
                      <td className="admin-inventory-numeric">{item.cantidadMinima}</td>
                      <td>
                        <span
                          className={`inventory-status-badge ${
                            STATUS_CLASS[item.estadoExistencias] || ""
                          }`}
                        >
                          {getInventoryStatusLabel(item.estadoExistencias)}
                        </span>
                      </td>
                      <td>{formatDate(item.fechaActualizacion)}</td>
                      <td>
                        <div className="inventory-action-buttons">
                          <button
                            type="button"
                            className="inventory-action-btn"
                            onClick={() => abrirAjuste(item)}
                          >
                            <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            type="button"
                            className="inventory-action-btn secondary"
                            onClick={() => abrirDetalle(item)}
                          >
                            <Eye size={15} strokeWidth={1.9} aria-hidden="true" />
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* En pantallas angostas la tabla se vuelve una lista de fichas. */}
            <ul className="admin-inventory-cards">
              {items.map((item) => (
                <li className="admin-inventory-card" key={`ficha-${item.idProducto}`}>
                  <div className="admin-inventory-card-head">
                    <strong>{item.nombre}</strong>
                    <span
                      className={`inventory-status-badge ${
                        STATUS_CLASS[item.estadoExistencias] || ""
                      }`}
                    >
                      {getInventoryStatusLabel(item.estadoExistencias)}
                    </span>
                  </div>

                  <dl className="admin-inventory-card-data">
                    <div>
                      <dt>Categoría</dt>
                      <dd>{item.nombreCategoria || "Sin categoría"}</dd>
                    </div>
                    <div>
                      <dt>Disponible</dt>
                      <dd>{item.cantidadDisponible}</dd>
                    </div>
                    <div>
                      <dt>Mínimo</dt>
                      <dd>{item.cantidadMinima}</dd>
                    </div>
                    <div>
                      <dt>Último ajuste</dt>
                      <dd>{formatDate(item.fechaActualizacion)}</dd>
                    </div>
                  </dl>

                  <div className="inventory-action-buttons">
                    <button
                      type="button"
                      className="inventory-action-btn"
                      onClick={() => abrirAjuste(item)}
                    >
                      <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inventory-action-btn secondary"
                      onClick={() => abrirDetalle(item)}
                    >
                      <Eye size={15} strokeWidth={1.9} aria-hidden="true" />
                      Ver
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
        open={Boolean(adjustTarget)}
        onClose={cerrarAjuste}
        title={`Ajustar existencias: ${adjustTarget?.nombre || ""}`}
      >
        <form className="admin-inventory-form" onSubmit={guardarAjuste}>
          <p className="admin-inventory-form-hint">
            El valor disponible reemplaza las existencias actuales y se refleja de
            inmediato en el catálogo.
          </p>

          <label>
            Cantidad disponible
            <input
              type="number"
              min="0"
              step="1"
              value={adjustForm.cantidadDisponible}
              onChange={(event) =>
                setAdjustForm((previo) => ({
                  ...previo,
                  cantidadDisponible: event.target.value,
                }))
              }
              required
            />
          </label>

          <label>
            Cantidad mínima
            <input
              type="number"
              min="0"
              step="1"
              value={adjustForm.cantidadMinima}
              onChange={(event) =>
                setAdjustForm((previo) => ({
                  ...previo,
                  cantidadMinima: event.target.value,
                }))
              }
              required
            />
            <small>Por debajo de este valor el producto se marca como stock bajo.</small>
          </label>

          <div className="admin-inventory-form-actions">
            <button
              type="button"
              className="inventory-action-btn secondary"
              onClick={cerrarAjuste}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="inventory-action-btn" disabled={saving}>
              {saving ? "Guardando..." : "Guardar ajuste"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail?.nombre || "Detalle del producto"}
      >
        {detailLoading && <p className="admin-inventory-state">Cargando detalle...</p>}

        {!detailLoading && detail && (
          <div className="admin-inventory-detail">
            <div className="admin-inventory-detail-media">
              <img
                className="admin-view-product-image"
                src={getCatalogProductImage(detail)}
                alt={detail.nombre}
                onError={(event) => handleCatalogImageFallback(event, detail.imagen)}
              />
            </div>

            <div className="admin-inventory-detail-body">
              <p className="admin-inventory-detail-description">
                {detail.descripcion || "Sin descripción registrada."}
              </p>

              <dl className="admin-inventory-detail-specs">
                <div>
                  <dt>Existencias</dt>
                  <dd>{detail.cantidadDisponible}</dd>
                </div>
                <div>
                  <dt>Mínimo</dt>
                  <dd>{detail.cantidadMinima}</dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>{formatCatalogPrice(detail.precio)}</dd>
                </div>
                <div>
                  <dt>Categoría</dt>
                  <dd>{detail.nombreCategoria || "Sin categoría"}</dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{detail.nombreTipo || "Sin tipo"}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{detail.estadoProducto}</dd>
                </div>
                <div>
                  <dt>Tamaño</dt>
                  <dd>{detail.tamano || "No indicado"}</dd>
                </div>
                <div>
                  <dt>Material</dt>
                  <dd>{detail.material || "No indicado"}</dd>
                </div>
              </dl>

              {detail.variantes?.length > 0 && (
                <section className="admin-inventory-variants">
                  <h4>
                    <PackageSearch size={16} strokeWidth={1.9} aria-hidden="true" />
                    Variantes ({detail.variantes.length})
                  </h4>
                  <ul>
                    {detail.variantes.map((variante) => (
                      <li key={variante.idVariante}>
                        <span>{variante.nombreVariante}</span>
                        <span>{formatCatalogPrice(variante.precio)}</span>
                        <span>{variante.stock} u.</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="admin-inventory-detail-footer">
                Último ajuste: {formatDate(detail.fechaActualizacion)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default AdminInventory;
