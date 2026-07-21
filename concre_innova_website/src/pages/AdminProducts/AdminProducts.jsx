import "./AdminProducts.css";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import {
  getCatalogCategories,
  getCatalogProducts,
  getCatalogTypes,
} from "../../services/catalogService";
import { createProduct, deleteProduct, updateProduct, uploadProductImage } from "../../services/productService";
import {
  buildAdminProductViewModel,
  buildProductRequestPayload,
  CATALOG_FILTER_OPTIONS,
  getProductFormValidation,
  handleCatalogImageCandidateFallback,
  normalizeCatalogCategories,
  normalizeCatalogTypes,
} from "../../services/catalogPresentationService";
import { DEFAULT_PAGINATION, normalizePaginatedResponse } from "../../services/paginationService";

const ADMIN_PRODUCTS_PAGE_SIZE = 9;

const EMPTY_PRODUCT_FORM = {
  idProducto: null,
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  idCategoria: "",
  idTipo: "",
  tamano: "",
  material: "",
  caracteristicas: "",
  cantidadDisponible: "",
  cantidadMinima: "",
};

function AdminProducts() {
  const [productList, setProductList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [typeList, setTypeList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [productPage, setProductPage] = useState(1);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
  });

  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT_FORM);

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadProducts(productPage);
  }, [productPage, searchTerm, selectedCategoryId]);

  const loadLookups = async () => {
    try {
      const [categoriesResponse, typesResponse] = await Promise.all([
        getCatalogCategories(),
        getCatalogTypes(),
      ]);

      setCategoryList(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      setTypeList(Array.isArray(typesResponse) ? typesResponse : []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los catalogos.");
      setCategoryList([]);
      setTypeList([]);
    }
  };

  const loadProducts = async (page = productPage) => {
    setLoading(true);
    setError("");

    try {
      const productsResponse = await getCatalogProducts({
        searchTerm,
        categoryId: selectedCategoryId === "all" ? undefined : selectedCategoryId,
        page,
        pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
      });
      const pagedProducts = normalizePaginatedResponse(
        productsResponse,
        page,
        ADMIN_PRODUCTS_PAGE_SIZE
      );

      setProductList(pagedProducts.items);
      setPagination(pagedProducts);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los productos.");
      setProductList([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        pageNumber: page,
        pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categoryList),
    [categoryList]
  );

  const normalizedTypes = useMemo(
    () => normalizeCatalogTypes(typeList),
    [typeList]
  );

  const products = useMemo(
    () => productList.map((product) => buildAdminProductViewModel(product, normalizedCategories)),
    [productList, normalizedCategories]
  );

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const handleImageFallback = (event, imageCandidates) => {
    handleCatalogImageCandidateFallback(event, imageCandidates);
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
      idTipo: product.idTipo,
      tamano: product.tamano,
      material: product.material,
      caracteristicas: product.caracteristicas,
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

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageUploading(true);

    try {
      const imagePath = await uploadProductImage(file);
      setNewProduct((previous) => ({
        ...previous,
        imagen: imagePath,
      }));

      await Swal.fire({
        icon: "success",
        title: "Imagen cargada",
        text: "La imagen se cargo correctamente.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (uploadError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo cargar la imagen",
        text: uploadError.message || "Verifica el archivo seleccionado.",
      });
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    const validation = getProductFormValidation(newProduct);
    if (validation) {
      await Swal.fire({
        icon: "warning",
        title: validation.title,
        text: validation.text,
      });
      return;
    }

    const payload = buildProductRequestPayload(newProduct, modalMode);

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

      setProductPage(1);
      loadProducts(1).catch(() => {
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
      await loadProducts(productPage);
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setProductPage(1);
              }}
            />

            <select
              className="admin-products-select"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setProductPage(1);
              }}
            >
              <option value="all">Todas</option>
              {normalizedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-primary-button" onClick={openAddModal}>
            Agregar producto
          </button>
        </div>

        {error && <div className="admin-products-error">{error}</div>}

        <p className="admin-products-count">
          {pagination.totalItems} producto{pagination.totalItems !== 1 ? "s" : ""} encontrado{pagination.totalItems !== 1 ? "s" : ""}
        </p>

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
                  <span>Tipo: {product.typeName}</span>
                  <span>Tamano: {product.tamano}</span>
                  <span>Material: {product.material}</span>
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

        {!loading && !error && pagination.totalItems > ADMIN_PRODUCTS_PAGE_SIZE && (
          <PaginationControls
            pagination={pagination}
            isLoading={loading}
            onPageChange={setProductPage}
          />
        )}

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
                    Tipo de producto
                    <select
                      name="idTipo"
                      value={newProduct.idTipo || ""}
                      onChange={handleNewProductChange}
                    >
                      <option value="">Sin tipo</option>
                      {normalizedTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Tamano
                    <input
                      type="text"
                      name="tamano"
                      list="product-size-options"
                      value={newProduct.tamano}
                      onChange={handleNewProductChange}
                      placeholder="Ej: Mediano"
                    />
                  </label>

                  <label>
                    Material
                    <input
                      type="text"
                      name="material"
                      list="product-material-options"
                      value={newProduct.material}
                      onChange={handleNewProductChange}
                      placeholder="Ej: Ceramica"
                    />
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

                <datalist id="product-size-options">
                  {CATALOG_FILTER_OPTIONS.SIZES.filter((option) => option.value !== "all").map(
                    (option) => (
                      <option key={option.value} value={option.value} />
                    )
                  )}
                </datalist>

                <datalist id="product-material-options">
                  {CATALOG_FILTER_OPTIONS.MATERIALS.filter((option) => option.value !== "all").map(
                    (option) => (
                      <option key={option.value} value={option.value} />
                    )
                  )}
                </datalist>

                <label>
                  Caracteristicas
                  <textarea
                    name="caracteristicas"
                    value={newProduct.caracteristicas}
                    onChange={handleNewProductChange}
                    rows="3"
                    placeholder="Ej: Resistente a la intemperie, apto para exteriores"
                  />
                </label>

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

                <label>
                  Cargar imagen
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={imageUploading || saving}
                  />
                </label>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-product-btn secondary" onClick={closeAddModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="admin-product-btn" disabled={saving || imageUploading}>
                    {imageUploading ? "Cargando imagen..." : (saving ? (modalMode === "edit" ? "Actualizando..." : "Guardando...") : (modalMode === "edit" ? "Actualizar" : "Registrar producto"))}
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
                  <p><strong>Tipo:</strong> {viewProduct.typeName || "-"}</p>
                  <p><strong>Tamano:</strong> {viewProduct.tamano || "-"}</p>
                  <p><strong>Material:</strong> {viewProduct.material || "-"}</p>
                  <p><strong>Caracteristicas:</strong> {viewProduct.caracteristicas || "-"}</p>
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
