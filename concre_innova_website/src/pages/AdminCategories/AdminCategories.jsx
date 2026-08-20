import "./AdminCategories.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { getCategoriesAdministracion, createCategory, updateCategory, deleteCategory } from "../../services/categoryService";
import {
  buildCategoryRequestPayload,
  getCategoryFormValidation,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";

const EMPTY_CATEGORY_FORM = {
  idCategoria: null,
  nombreCategoria: "",
  descripcion: "",
  estado: "Activo",
};

function AdminCategories() {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);

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
      setError(loadError.message || "No se pudieron cargar las categorias.");
      setCategoryList([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = normalizeCatalogCategories(categoryList);

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
    setCategoryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();

    const validation = getCategoryFormValidation(categoryForm, categories);
    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.text,
      });
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
        title: modalMode === "edit" ? "Actualizacion exitosa" : "Categoria creada",
        text:
          modalMode === "edit"
            ? "La categoria se actualizo correctamente."
            : "La categoria se registro correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      await loadData();
    } catch (saveError) {
      await Swal.fire({
        icon: "error",
        title: modalMode === "edit" ? "No se pudo actualizar" : "No se pudo crear",
        text:
          saveError.message ||
          (modalMode === "edit"
            ? "Error al actualizar la categoria."
            : "Error al crear la categoria."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar categoria",
      text: `Deseas eliminar ${category.name}?`,
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteCategory(Number(category.id));
      await Swal.fire({
        icon: "success",
        title: "Categoria eliminada",
        text: "La categoria fue eliminada correctamente.",
      });
      await loadData();
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: deleteError.message || "Error al eliminar la categoria.",
      });
    }
  };

  return (
    <AdminLayout title="Gestión de Categorías">
      <div className="admin-categories-page">
        <div className="admin-categories-topbar">
          <div>
            <h2 className="admin-section-title">Categorías del catálogo</h2>
            <p className="admin-section-subtitle">
              Administra los grupos de productos disponibles en la tienda.
            </p>
          </div>

          <button className="admin-primary-button" onClick={openAddModal}>
            Agregar categoría
          </button>
        </div>

        {error && <div className="admin-products-error">{error}</div>}

        <div className="admin-categories-grid">
          {loading && (
            <div className="admin-products-empty">Cargando categorías...</div>
          )}

          {!loading && categories.map((category) => (
            <div className="admin-category-card" key={category.id}>
              <div className="admin-category-header">
                <h3>{category.name}</h3>
                <span
                  className={`admin-category-status ${
                    category.estado === "Activo" ? "activa" : "inactiva"
                  }`}
                >
                  {category.estado === "Activo" ? "Activa" : "Inactiva"}
                </span>
              </div>

              <p className="admin-category-description">{category.descripcion || "Sin descripcion"}</p>

              <div className="admin-category-actions">
                <button className="admin-category-btn" onClick={() => openEditModal(category)}>
                  Editar
                </button>
                <button
                  className="admin-category-btn danger"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {!loading && categories.length === 0 && (
            <div className="admin-products-empty">No hay categorías registradas.</div>
          )}
        </div>

        {showModal && (
          <div className="admin-modal-backdrop" onClick={closeModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{modalMode === "edit" ? "Editar categoria" : "Nueva categoria"}</h3>
                <button className="admin-modal-close" onClick={closeModal} disabled={saving}>
                  ×
                </button>
              </div>

              <form className="admin-modal-form" onSubmit={handleSaveCategory}>
                <label>
                  Nombre
                  <input
                    type="text"
                    name="nombreCategoria"
                    value={categoryForm.nombreCategoria}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Descripción
                  <textarea
                    name="descripcion"
                    value={categoryForm.descripcion}
                    onChange={handleFormChange}
                    rows="3"
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
                  <button type="button" className="admin-category-btn secondary" onClick={closeModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-category-btn" disabled={saving}>
                    {saving ? (modalMode === "edit" ? "Actualizando..." : "Guardando...") : (modalMode === "edit" ? "Actualizar" : "Registrar categoria")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminCategories;
