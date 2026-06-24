import "./AdminProducts.css";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import {
  getCatalogCategories,
  getCatalogProducts,
  getProductImageCandidates,
} from "../../services/catalogService";
import { createProduct, deleteProduct, updateProduct } from "../../services/productService";
import productImage from "../../img/Maceta-Negra.jpg";

const EMPTY_PRODUCT_FORM = {
  idProducto: null,
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  idCategoria: "",
  cantidadDisponible: "",
  cantidadMinima: "",
};

function AdminProducts() {
  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState("add");

  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT_FORM);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        getCatalogProducts(),
        getCatalogCategories(),
      ]);

      setProductList(Array.isArray(productsResponse) ? productsResponse : []);
      setCategoryList(Array.isArray(categoriesResponse) ? categoriesResponse : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los productos.");
      setProductList([]);
      setCategoryList([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizedCategories = useMemo(
    () =>
      categoryList
        .map((category) => ({
          id: String(category.idCategoria ?? category.id ?? ""),
          name: category.nombreCategoria ?? category.nombre ?? "Sin nombre",
        }))
        .filter((category) => category.id),
    [categoryList]
  );

  const products = useMemo(
    () =>
      productList.map((product) => {
        const id = product.idProducto ?? product.id;
        const categoryId = String(product.idCategoria ?? "");
        const categoryName =
          product.nombreCategoria ||
          normalizedCategories.find((category) => category.id === categoryId)?.name ||
          "Sin categoria";
        const stock = Number(product.cantidadDisponible ?? product.stock ?? 0);
        const imageCandidates = getProductImageCandidates(product.imagen);

        return {
          id,
          idProducto: id,
          name: product.nombre ?? "Producto sin nombre",
          nombre: product.nombre ?? "",
          descripcion: product.descripcion ?? "",
          price: Number(product.precio) || 0,
          precio: Number(product.precio) || 0,
          category: categoryName,
          categoryId,
          idCategoria: categoryId,
          stock,
          cantidadDisponible: stock,
          minStock: Number(product.cantidadMinima ?? 0),
          cantidadMinima: Number(product.cantidadMinima ?? 0),
          status: product.estado || (stock > 0 ? "Activo" : "Inactivo"),
          estado: product.estado || (stock > 0 ? "Activo" : "Inactivo"),
          imagen: product.imagen ?? "",
          image: imageCandidates[0] || productImage,
          imageCandidates,
        };
      }),
    [productList, normalizedCategories]
  );

  const categories = [
    "Todas",
    ...new Set(products.map((product) => product.category))
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "Todas" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleImageFallback = (event, imageCandidates) => {
    const currentIndex = Number(event.currentTarget.dataset.candidateIndex || 0);
    const nextIndex = currentIndex + 1;

    if (Array.isArray(imageCandidates) && nextIndex < imageCandidates.length) {
      event.currentTarget.dataset.candidateIndex = String(nextIndex);
      event.currentTarget.src = imageCandidates[nextIndex];
      return;
    }

    event.currentTarget.onerror = null;
    event.currentTarget.src = productImage;
  };

  const openAddModal = () => {
    setModalMode("add");
    setNewProduct({
      ...EMPTY_PRODUCT_FORM,
      idCategoria: normalizedCategories[0]?.id || "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setModalMode("edit");
    setNewProduct({
      idProducto: product.idProducto,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: String(product.precio),
      imagen: product.imagen,
      idCategoria: product.idCategoria,
      cantidadDisponible: String(product.cantidadDisponible),
      cantidadMinima: String(product.cantidadMinima),
    });
    setShowAddModal(true);
  };

  const openViewModal = (product) => {
    setViewProduct(product);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewProduct(null);
  };

  const closeAddModal = () => {
    if (!saving) {
      setShowAddModal(false);
    }
  };

  const handleNewProductChange = (event) => {
    const { name, value } = event.target;
    setNewProduct((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    if (!newProduct.nombre.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Nombre requerido",
        text: "Ingresa el nombre del producto.",
      });
      return;
    }

    if (!newProduct.idCategoria) {
      await Swal.fire({
        icon: "warning",
        title: "Categoria requerida",
        text: "Selecciona una categoria.",
      });
      return;
    }

    if (!newProduct.imagen.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Imagen requerida",
        text: "Ingresa el nombre o ruta de la imagen.",
      });
      return;
    }

    const precio = Number(newProduct.precio);
    const cantidadDisponible = Number(newProduct.cantidadDisponible);
    const cantidadMinima = Number(newProduct.cantidadMinima);

    if (Number.isNaN(precio) || precio < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Precio invalido",
        text: "Ingresa un precio valido.",
      });
      return;
    }

    if (Number.isNaN(cantidadDisponible) || cantidadDisponible < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Cantidad disponible invalida",
        text: "Ingresa una cantidad disponible valida.",
      });
      return;
    }

    if (Number.isNaN(cantidadMinima) || cantidadMinima < 0) {
      await Swal.fire({
        icon: "warning",
        title: "Cantidad minima invalida",
        text: "Ingresa una cantidad minima valida.",
      });
      return;
    }

    const payload = {
      ...(modalMode === "edit" ? { idProducto: Number(newProduct.idProducto) } : {}),
      nombre: newProduct.nombre.trim(),
      descripcion: newProduct.descripcion.trim(),
      precio,
      imagen: newProduct.imagen.trim(),
      idCategoria: Number(newProduct.idCategoria),
      cantidadDisponible,
      cantidadMinima,
      estado: "Activo",
    };

    setSaving(true);
    try {
      if (modalMode === "edit") {
        await updateProduct(Number(newProduct.idProducto), payload);
      } else {
        await createProduct(payload);
      }

      setShowAddModal(false);

      await Swal.fire({
        icon: "success",
        title: modalMode === "edit" ? "Actualizacion exitosa" : "Ingreso exitoso",
        text:
          modalMode === "edit"
            ? "El producto se actualizo correctamente."
            : "El producto se agrego correctamente.",
        timer: 1800,
        showConfirmButton: false,
      });

      loadData().catch(() => {
        // Si falla la recarga, se muestra error en pantalla principal.
      });
    } catch (createError) {
      await Swal.fire({
        icon: "error",
        title: modalMode === "edit" ? "No se pudo actualizar" : "No se pudo crear",
        text:
          createError.message ||
          (modalMode === "edit"
            ? "Error al actualizar el producto."
            : "Error al crear el producto."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar producto",
      text: `Deseas eliminar ${product.name}?`,
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteProduct(product.id);
      await Swal.fire({
        icon: "success",
        title: "Producto eliminado",
        text: "El producto fue eliminado correctamente.",
      });
      await loadData();
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: deleteError.message || "Error al eliminar el producto.",
      });
    }
  };

  return (
    <AdminLayout title="Gestión de Productos">
      <div className="admin-products-page">
        <div className="admin-products-topbar">
          <div className="admin-products-filters">
            <input
              type="text"
              placeholder="Buscar producto"
              className="admin-products-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="admin-products-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-primary-button" onClick={openAddModal}>
            Agregar producto
          </button>
        </div>

        {error && <div className="admin-products-error">{error}</div>}

        <div className="admin-products-grid">
          {loading && (
            <div className="admin-products-empty">Cargando productos...</div>
          )}

          {!loading && filteredProducts.map((product) => (
            <div className="admin-product-card" key={product.id}>
              <img
                src={product.image}
                alt={product.name}
                className="admin-product-image"
                onError={(event) => handleImageFallback(event, product.imageCandidates)}
              />

              <div className="admin-product-info">
                <div className="admin-product-header">
                  <h3>{product.name}</h3>
                  <span
                    className={`admin-product-status ${
                      product.status === "Activo" ? "active" : "inactive"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>

                <p className="admin-product-category">{product.category}</p>

                <div className="admin-product-details">
                  <span>Precio: ${product.price.toFixed(2)}</span>
                  <span>Stock: {product.stock}</span>
                </div>

                <div className="admin-product-actions">
                  <button className="admin-product-btn" onClick={() => openEditModal(product)}>
                    Editar
                  </button>
                  <button className="admin-product-btn secondary" onClick={() => openViewModal(product)}>
                    Ver
                  </button>
                  <button
                    className="admin-product-btn danger"
                    onClick={() => handleDeleteProduct(product)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && filteredProducts.length === 0 && (
            <div className="admin-products-empty">
              No se encontraron productos con los filtros seleccionados.
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="admin-modal-backdrop" onClick={closeAddModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{modalMode === "edit" ? "Editar producto" : "Nuevo producto"}</h3>
                <button className="admin-modal-close" onClick={closeAddModal} disabled={saving}>
                  ×
                </button>
              </div>

              <form className="admin-modal-form" onSubmit={handleSaveProduct}>
                <label>
                  Nombre
                  <input
                    type="text"
                    name="nombre"
                    value={newProduct.nombre}
                    onChange={handleNewProductChange}
                    required
                  />
                </label>

                <label>
                  Descripcion
                  <textarea
                    name="descripcion"
                    value={newProduct.descripcion}
                    onChange={handleNewProductChange}
                    rows="3"
                  />
                </label>

                <div className="admin-modal-grid">
                  <label>
                    Precio
                    <input
                      type="number"
                      name="precio"
                      step="0.01"
                      min="0"
                      value={newProduct.precio}
                      onChange={handleNewProductChange}
                      required
                    />
                  </label>

                  <label>
                    Categoria
                    <select
                      name="idCategoria"
                      value={newProduct.idCategoria}
                      onChange={handleNewProductChange}
                      required
                    >
                      <option value="">Selecciona</option>
                      {normalizedCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Cantidad disponible
                    <input
                      type="number"
                      name="cantidadDisponible"
                      min="0"
                      value={newProduct.cantidadDisponible}
                      onChange={handleNewProductChange}
                      required
                    />
                  </label>

                  <label>
                    Cantidad minima
                    <input
                      type="number"
                      name="cantidadMinima"
                      min="0"
                      value={newProduct.cantidadMinima}
                      onChange={handleNewProductChange}
                      required
                    />
                  </label>

                </div>

                <label>
                  Imagen del producto
                  <input
                    type="text"
                    name="imagen"
                    value={newProduct.imagen}
                    onChange={handleNewProductChange}
                    placeholder="Ej: bugambilia.jpg"
                    required
                  />
                </label>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-product-btn secondary" onClick={closeAddModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-product-btn" disabled={saving}>
                    {saving ? (modalMode === "edit" ? "Actualizando..." : "Guardando...") : (modalMode === "edit" ? "Actualizar" : "Guardar")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showViewModal && viewProduct && (
          <div className="admin-modal-backdrop" onClick={closeViewModal}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Detalle del producto</h3>
                <button className="admin-modal-close" onClick={closeViewModal}>
                  ×
                </button>
              </div>

              <div className="admin-view-product">
                <img
                  src={viewProduct.image}
                  alt={viewProduct.name}
                  className="admin-view-product-image"
                  onError={(event) => handleImageFallback(event, viewProduct.imageCandidates)}
                />

                <div className="admin-view-product-info">
                  <p><strong>Nombre:</strong> {viewProduct.nombre || "-"}</p>
                  <p><strong>Descripcion:</strong> {viewProduct.descripcion || "-"}</p>
                  <p><strong>Categoria:</strong> {viewProduct.category || "-"}</p>
                  <p><strong>Precio:</strong> ${viewProduct.price.toFixed(2)}</p>
                  <p><strong>Cantidad disponible:</strong> {viewProduct.cantidadDisponible}</p>
                  <p><strong>Estado:</strong> {viewProduct.estado || "Activo"}</p>
                  <p><strong>Imagen:</strong> {viewProduct.imagen || "-"}</p>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="admin-product-btn secondary" onClick={closeViewModal}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminProducts;