import "./AdminProductTypes.css";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import { getTiposProductoAdministracion, createTipoProducto, updateTipoProducto, deleteTipoProducto } from "../../services/tipoProductoService";
import {
  buildTipoProductoRequestPayload,
  getTipoProductoFormValidation,
  normalizeCatalogTypes,
} from "../../services/catalogPresentationService";

const EMPTY_TYPE_FORM = {
  idTipo: null,
  nombreTipo: "",
  descripcion: "",
  estado: "Activo",
};

function AdminProductTypes() {
  const [typeList, setTypeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getTiposProductoAdministracion();
      setTypeList(Array.isArray(response) ? response : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los tipos de producto.");
      setTypeList([]);
    } finally {
      setLoading(false);
    }
  };

  const types = normalizeCatalogTypes(typeList);

  const openAddModal = () => {
    setModalMode("add");
    setTypeForm(EMPTY_TYPE_FORM);
    setShowModal(true);
  };

  const openEditModal = (type) => {
    setModalMode("edit");
    setTypeForm({
      idTipo: type.id,
      nombreTipo: type.name,
      descripcion: type.descripcion,
      estado: type.estado,
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
    setTypeForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveType = async (event) => {
    event.preventDefault();

    const validation = getTipoProductoFormValidation(typeForm, types);
    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.text,
      });
      return;
    }

    const payload = buildTipoProductoRequestPayload(typeForm, modalMode);

    setSaving(true);
    try {
      if (modalMode === "edit") {
        await updateTipoProducto(Number(typeForm.idTipo), payload);
      } else {
        await createTipoProducto(payload);
      }

      setShowModal(false);

      await Swal.fire({
        icon: "success",
        title: modalMode === "edit" ? "Actualización exitosa" : "Tipo creado",
        text:
          modalMode === "edit"
            ? "El tipo de producto se actualizó correctamente."
            : "El tipo de producto se registro correctamente.",
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
            ? "Error al actualizar el tipo de producto."
            : "Error al crear el tipo de producto."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (type) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar tipo de producto",
      text: `Deseas eliminar ${type.name}?`,
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteTipoProducto(Number(type.id));
      await Swal.fire({
        icon: "success",
        title: "Tipo eliminado",
        text: "El tipo de producto fue eliminado correctamente.",
      });
      await loadData();
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: deleteError.message || "Error al eliminar el tipo de producto.",
      });
    }
  };

  return (
    <AdminLayout title="Gestión de Tipos de Producto">
      <div className="admin-types-page">
        <div className="admin-types-topbar">
          <div>
            <h2 className="admin-section-title">Tipos de producto</h2>
            <p className="admin-section-subtitle">
              Administra los tipos disponibles para clasificar los productos.
            </p>
          </div>

          <button className="admin-primary-button" onClick={openAddModal}>
            Agregar tipo
          </button>
        </div>

        {error && <div className="admin-types-error">{error}</div>}

        <div className="admin-types-grid">
          {loading && (
            <div className="admin-types-empty">Cargando tipos de producto...</div>
          )}

          {!loading && types.map((type) => (
            <div className="admin-type-card" key={type.id}>
              <div className="admin-type-header">
                <h3>{type.name}</h3>
                <span
                  className={`admin-type-status ${
                    type.estado === "Activo" ? "activa" : "inactiva"
                  }`}
                >
                  {type.estado === "Activo" ? "Activo" : "Inactivo"}
                </span>
              </div>

              <p className="admin-type-description">{type.descripcion || "Sin descripción"}</p>

              <div className="admin-type-actions">
                <button className="admin-type-btn" onClick={() => openEditModal(type)}>
                  Editar
                </button>
                <button
                  className="admin-type-btn danger"
                  onClick={() => handleDeleteType(type)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {!loading && types.length === 0 && (
            <div className="admin-types-empty">No hay tipos de producto registrados.</div>
          )}
        </div>

        {showModal && (
          <div className="admin-modal-backdrop" onClick={closeModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{modalMode === "edit" ? "Editar tipo de producto" : "Nuevo tipo de producto"}</h3>
                <button className="admin-modal-close" onClick={closeModal} disabled={saving}>
                  ×
                </button>
              </div>

              <form className="admin-modal-form" onSubmit={handleSaveType}>
                <label>
                  Nombre
                  <input
                    type="text"
                    name="nombreTipo"
                    value={typeForm.nombreTipo}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Descripción
                  <textarea
                    name="descripcion"
                    value={typeForm.descripcion}
                    onChange={handleFormChange}
                    rows="3"
                  />
                </label>

                {modalMode === "edit" && (
                  <label>
                    Estado
                    <select name="estado" value={typeForm.estado} onChange={handleFormChange}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </label>
                )}

                <div className="admin-modal-actions">
                  <button type="button" className="admin-type-btn secondary" onClick={closeModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-type-btn" disabled={saving}>
                    {saving ? (modalMode === "edit" ? "Actualizando..." : "Guardando...") : (modalMode === "edit" ? "Actualizar" : "Registrar tipo")}
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

export default AdminProductTypes;
