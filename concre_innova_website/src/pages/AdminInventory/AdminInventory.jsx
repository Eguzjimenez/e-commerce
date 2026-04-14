import "./AdminInventory.css";
import { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminInventory() {
  const inventoryData = [
    {
      id: 1,
      name: "Macetero de cerámica negro",
      category: "Maceteros",
      currentStock: 18,
      minimumStock: 10
    },
    {
      id: 2,
      name: "Palma de interior",
      category: "Plantas",
      currentStock: 6,
      minimumStock: 8
    },
    {
      id: 3,
      name: "Fuente decorativa",
      category: "Fuentes",
      currentStock: 3,
      minimumStock: 2
    },
    {
      id: 4,
      name: "Piedras decorativas",
      category: "Accesorios",
      currentStock: 0,
      minimumStock: 5
    },
    {
      id: 5,
      name: "Macetero colgante",
      category: "Maceteros",
      currentStock: 12,
      minimumStock: 6
    },
    {
      id: 6,
      name: "Lengua de suegra",
      category: "Plantas",
      currentStock: 4,
      minimumStock: 7
    }
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const categories = ["Todas", ...new Set(inventoryData.map((item) => item.category))];

  const getStatus = (currentStock, minimumStock) => {
    if (currentStock === 0) return "Agotado";
    if (currentStock <= minimumStock) return "Stock bajo";
    return "Disponible";
  };

  const filteredInventory = useMemo(() => {
    return inventoryData.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "Todas" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <AdminLayout title="Gestión de Inventario">
      <div className="admin-inventory-page">
        <div className="admin-inventory-topbar">
          <div className="admin-inventory-filters">
            <input
              type="text"
              placeholder="Buscar producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-inventory-search"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="admin-inventory-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button className="admin-primary-button">Ajustar stock</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Nombre del producto</th>
                <th>Categoría</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map((item) => {
                const status = getStatus(item.currentStock, item.minimumStock);

                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.minimumStock}</td>
                    <td>
                      <span
                        className={`inventory-status-badge ${
                          status === "Disponible"
                            ? "status-available"
                            : status === "Stock bajo"
                            ? "status-low"
                            : "status-out"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="inventory-action-buttons">
                        <button className="inventory-action-btn">Editar</button>
                        <button className="inventory-action-btn secondary">
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty-row">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminInventory;