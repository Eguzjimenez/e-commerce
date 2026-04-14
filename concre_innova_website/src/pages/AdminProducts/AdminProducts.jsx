import "./AdminProducts.css";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";
import productImage from "../../img/Maceta-Negra.jpg";

function AdminProducts() {
  const productList = [
    {
      id: 1,
      name: "Macetero de cerámica negro",
      price: 24.99,
      category: "Maceteros",
      stock: 18,
      status: "Activo",
      image: productImage
    },
    {
      id: 2,
      name: "Palma de interior",
      price: 35.5,
      category: "Plantas",
      stock: 6,
      status: "Activo",
      image: productImage
    },
    {
      id: 3,
      name: "Fuente decorativa",
      price: 89.99,
      category: "Fuentes",
      stock: 3,
      status: "Activo",
      image: productImage
    },
    {
      id: 4,
      name: "Set de piedras",
      price: 12.0,
      category: "Accesorios",
      stock: 0,
      status: "Inactivo",
      image: productImage
    },
    {
      id: 5,
      name: "Macetero colgante",
      price: 19.99,
      category: "Maceteros",
      stock: 12,
      status: "Activo",
      image: productImage
    },
    {
      id: 6,
      name: "Suculenta mini",
      price: 9.99,
      category: "Plantas",
      stock: 15,
      status: "Activo",
      image: productImage
    }
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const categories = [
    "Todas",
    ...new Set(productList.map((product) => product.category))
  ];

  const filteredProducts = useMemo(() => {
    return productList.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "Todas" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

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

          <button className="admin-primary-button">Agregar producto</button>
        </div>

        <div className="admin-products-grid">
          {filteredProducts.map((product) => (
            <div className="admin-product-card" key={product.id}>
              <img
                src={product.image}
                alt={product.name}
                className="admin-product-image"
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
                  <button className="admin-product-btn">Editar</button>
                  <button className="admin-product-btn secondary">Ver</button>
                  <button className="admin-product-btn danger">Eliminar</button>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="admin-products-empty">
              No se encontraron productos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminProducts;