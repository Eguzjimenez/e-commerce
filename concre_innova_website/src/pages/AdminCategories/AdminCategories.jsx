import "./AdminCategories.css";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminCategories() {
  const categories = [
    {
      id: 1,
      nombre: "Maceteros",
      descripcion: "Maceteros decorativos de distintos tamaños y materiales.",
      cantidadProductos: 18,
      estado: "Activa"
    },
    {
      id: 2,
      nombre: "Plantas",
      descripcion: "Plantas de interior y exterior para decoración y jardín.",
      cantidadProductos: 24,
      estado: "Activa"
    },
    {
      id: 3,
      nombre: "Fuentes",
      descripcion: "Fuentes decorativas para espacios internos y externos.",
      cantidadProductos: 7,
      estado: "Activa"
    },
    {
      id: 4,
      nombre: "Accesorios",
      descripcion: "Piedras, bases, soportes y artículos complementarios.",
      cantidadProductos: 12,
      estado: "Activa"
    },
    {
      id: 5,
      nombre: "Colección Premium",
      descripcion: "Productos exclusivos de edición especial.",
      cantidadProductos: 4,
      estado: "Inactiva"
    }
  ];

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

          <button className="admin-primary-button">Agregar categoría</button>
        </div>

        <div className="admin-categories-grid">
          {categories.map((category) => (
            <div className="admin-category-card" key={category.id}>
              <div className="admin-category-header">
                <h3>{category.nombre}</h3>
                <span
                  className={`admin-category-status ${
                    category.estado === "Activa" ? "activa" : "inactiva"
                  }`}
                >
                  {category.estado}
                </span>
              </div>

              <p className="admin-category-description">{category.descripcion}</p>

              <div className="admin-category-info">
                <span>
                  <strong>Productos:</strong> {category.cantidadProductos}
                </span>
              </div>

              <div className="admin-category-actions">
                <button className="admin-category-btn">Editar</button>
                <button className="admin-category-btn secondary">Ver</button>
                <button className="admin-category-btn danger">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCategories;