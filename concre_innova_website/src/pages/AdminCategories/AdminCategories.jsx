import "./AdminCategories.css";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from "lucide-react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import Modal from "../../components/Modal/Modal";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  getCategoriesAdministracion,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import {
  buildCategoryRequestPayload,
  findDuplicateCategory,
  getCategoryFormValidation,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";

const EMPTY_CATEGORY_FORM = {
  idCategoria: null,
  nombreCategoria: "",
  descripcion: "",
  estado: "Activo",
};

const PAGE_SIZE = 9;

const ESTADO_FILTROS = [
  { value: "", label: "Todos los estados" },
  { value: "Activo", label: "Activas" },
  { value: "Inactivo", label: "Inactivas" },
];

const ORDENES = [
  { value: "nombre", label: "Nombre (A-Z)" },
  { value: "nombre-desc", label: "Nombre (Z-A)" },
  { value: "recientes", label: "Más recientes" },
];

function AdminCategories() {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [orden, setOrden] = useState("nombre");
  const [page, setPage] = useState(1);

  // El filtro se aplica al dejar de escribir, no en cada tecla.
  const busquedaDiferida = useDebouncedValue(busqueda);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCategoriesAdministracion();
      setCategoryList(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las categorías.");
      setCategoryList([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(
    () => normalizeCatalogCategories(categoryList),
    [categoryList]
  );

  /** Búsqueda, filtro por estado y orden sobre la lista completa. */
  const categoriasFiltradas = useMemo(() => {
    const termino = busquedaDiferida.trim().toLowerCase();

    const filtradas = categories.filter((categoria) => {
      const coincideTexto =
        !termino ||
        String(categoria.name || "").toLowerCase().includes(termino) ||
        String(categoria.descripcion || "").toLowerCase().includes(termino);
      const coincideEstado = !estadoFiltro || categoria.estado === estadoFiltro;

      return coincideTexto && coincideEstado;
    });

    const ordenadas = [...filtradas];

    if (orden === "nombre-desc") {
      ordenadas.sort((a, b) => String(b.name).localeCompare(String(a.name), "es"));
    } else if (orden === "recientes") {
      ordenadas.sort((a, b) => Number(b.id) - Number(a.id));
    } else {
      ordenadas.sort((a, b) => String(a.name).localeCompare(String(b.name), "es"));
    }

    return ordenadas;
  }, [categories, busquedaDiferida, estadoFiltro, orden]);

  const totalPages = Math.max(1, Math.ceil(categoriasFiltradas.length / PAGE_SIZE));
  const paginaActual = Math.min(page, totalPages);
  const visibles = categoriasFiltradas.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  );

  const paginacion = {
    items: visibles,
    totalItems: categoriasFiltradas.length,
    pageNumber: paginaActual,
    pageSize: PAGE_SIZE,
    totalPages,
    hasPreviousPage: paginaActual > 1,
    hasNextPage: paginaActual < totalPages,
  };

  // El choque de nombres se avisa mientras se escribe, no solo al guardar.
  const categoriaDuplicada = useMemo(
    () =>
      findDuplicateCategory(
        categoryForm.nombreCategoria,
        categories,
        categoryForm.idCategoria
      ),
    [categoryForm.nombreCategoria, categoryForm.idCategoria, categories]
  );

  const cambiarFiltro = (accion) => {
    accion();
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode("add");
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setCategoryForm({
      idCategoria: category.id,
      nombreCategoria: category.name,
      descripcion: category.descripcion,
      estado: category.estado,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (!saving) {
      setShowModal(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();

    const validation = getCategoryFormValidation(categoryForm, categories);

    if (validation) {
      await Swal.fire({ icon: "warning", title: validation.title, text: validation.text });
      return;
    }

    const payload = buildCategoryRequestPayload(categoryForm, modalMode);
    setSaving(true);

    try {
      if (modalMode === "edit") {
        await updateCategory(Number(categoryForm.idCategoria), payload);
      } else {
        await createCategory(payload);
      }

      setShowModal(false);

      await Swal.fire({
        icon: "success",
        title: modalMode === "edit" ? "Categoría actualizada" : "Categoría creada",
        timer: 1600,
        showConfirmButton: false,
      });

      await loadData();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: modalMode === "edit" ? "No se pudo actualizar" : "No se pudo crear",
        text: saveError.message || "Revisa los datos e intenta de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar categoría",
      text: `¿Deseas eliminar "${category.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteCategory(Number(category.id));
      await Swal.fire({
        icon: "success",
        title: "Categoría eliminada",
        timer: 1500,
        showConfirmButton: false,
      });
      await loadData();
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: deleteError.message || "Error al eliminar la categoría.",
      });
    }
  };

  const activas = categories.filter((categoria) => categoria.estado === "Activo").length;

  return (
    <AdminLayout
      title="Categorías"
      subtitle="Administra los grupos de productos disponibles en la tienda."
    >
      <div className="admin-categories-page">
        <div className="admin-categories-topbar">
          <p className="admin-categories-count">
            {loading
              ? "Cargando..."
              : `${categories.length} categoría(s) · ${activas} activa(s)`}
          </p>

          <button className="admin-primary-button" onClick={openAddModal} type="button">
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Agregar categoría
          </button>
        </div>

        {/* Filtros: con muchas categorías, encontrarlas dejó de depender del scroll. */}
        <div className="admin-categories-filters">
          <label className="admin-categories-field">
            <span>Buscar</span>
            <span className="admin-categories-search">
              <Search size={16} strokeWidth={1.9} aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                placeholder="Nombre o descripción"
                onChange={(event) => cambiarFiltro(() => setBusqueda(event.target.value))}
              />
            </span>
          </label>

          <label className="admin-categories-field">
            <span>Estado</span>
            <select
              value={estadoFiltro}
              onChange={(event) => cambiarFiltro(() => setEstadoFiltro(event.target.value))}
            >
              {ESTADO_FILTROS.map((filtro) => (
                <option key={filtro.value || "todos"} value={filtro.value}>
                  {filtro.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-categories-field">
            <span>Orden</span>
            <select value={orden} onChange={(event) => setOrden(event.target.value)}>
              {ORDENES.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="admin-products-error">{error}</div>}

        {loading && <p className="admin-categories-state">Cargando categorías...</p>}

        {!loading && !error && categoriasFiltradas.length === 0 && (
          <p className="admin-categories-state">
            <LayoutGrid size={18} strokeWidth={1.8} aria-hidden="true" />
            {categories.length === 0
              ? "No hay categorías registradas."
              : "Ninguna categoría coincide con el filtro."}
          </p>
        )}

        {!loading && !error && visibles.length > 0 && (
          <>
            <div className="admin-categories-grid">
              {visibles.map((category) => (
                <article className="admin-category-card" key={category.id}>
                  <header className="admin-category-header">
                    <h3>{category.name}</h3>
                    <span
                      className={`admin-category-status ${
                        category.estado === "Activo" ? "activa" : "inactiva"
                      }`}
                    >
                      {category.estado === "Activo" ? "Activa" : "Inactiva"}
                    </span>
                  </header>

                  <p className="admin-category-description">
                    {category.descripcion || "Sin descripción"}
                  </p>

                  <footer className="admin-category-actions">
                    <button
                      className="admin-category-btn"
                      type="button"
                      onClick={() => openEditModal(category)}
                    >
                      <Pencil size={14} strokeWidth={1.9} aria-hidden="true" />
                      Editar
                    </button>
                    <button
                      className="admin-category-btn danger"
                      type="button"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      <Trash2 size={14} strokeWidth={1.9} aria-hidden="true" />
                      Eliminar
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationControls
                pagination={paginacion}
                isLoading={loading}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={modalMode === "edit" ? "Editar categoría" : "Nueva categoría"}
      >
        <form className="admin-modal-form" onSubmit={handleSaveCategory}>
          <label>
            Nombre
            <input
              type="text"
              name="nombreCategoria"
              value={categoryForm.nombreCategoria}
              onChange={handleFormChange}
              aria-invalid={categoriaDuplicada ? "true" : undefined}
              aria-describedby={categoriaDuplicada ? "categoria-duplicada" : undefined}
              required
            />
            {categoriaDuplicada && (
              <small className="admin-category-duplicate" id="categoria-duplicada">
                Ya existe la categoría «{categoriaDuplicada.name}». Usa otro nombre.
              </small>
            )}
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={categoryForm.descripcion}
              onChange={handleFormChange}
              rows="3"
              maxLength={255}
            />
          </label>

          {modalMode === "edit" && (
            <label>
              Estado
              <select name="estado" value={categoryForm.estado} onChange={handleFormChange}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>
          )}

          <div className="admin-modal-actions">
            <button
              type="button"
              className="admin-category-btn secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="admin-category-btn"
              disabled={saving || Boolean(categoriaDuplicada)}
            >
              {saving
                ? "Guardando..."
                : modalMode === "edit"
                ? "Actualizar"
                : "Registrar categoría"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

export default AdminCategories;
