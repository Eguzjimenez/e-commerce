import IMAGEN from "../../img/Maceta-Negra.jpg";
import "./Home.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../routes/routes";
import { getUserRole } from "../../services/authService";
import { isStaffRole, isVendorRole } from "../../constants/roleAccess";
import ProductModal from "../../components/ProductModal/ProductModal";

function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("home");
  const userRole = getUserRole();
  const showStaffAccess = isStaffRole(userRole);

  return (
    <div>
      {/* HERO / BIENVENIDA */}
      <section className="hero">
        <div className="hero-content">
          <h1>Diseño natural para tu espacio 🌿</h1>
          <p>Decoración ecológica con estilo moderno y minimalista</p>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="about container">
        <h2>Sobre nosotros</h2>
        <p>
          En Concre Innova creamos piezas únicas que combinan naturaleza y diseño.
          Nuestro objetivo es transformar espacios con productos ecológicos,
          modernos y funcionales.
        </p>
      </section>

      {/* ACCESO ADMINISTRATIVO */}
      {showStaffAccess && (
        <section className="container admin-home-access">
          <div className="admin-home-card">
            <div className="admin-home-card-content">
              <span className="admin-home-badge">Acceso interno</span>
              <h2>{isVendorRole(userRole) ? "Panel de ventas" : "Panel de administracion"}</h2>
              <p>
                Gestiona las funciones internas disponibles para tu rol desde un solo lugar.
              </p>
            </div>

            <div className="admin-home-card-action">
              <Link to={ADMIN_ROUTES.DASHBOARD} className="admin-home-button">
                Ir al panel
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="container">
        <h2>Productos destacados</h2>

        <div className="grid">
          {[1, 2, 3, 4].map((item) => (
            <div
              className="card"
              key={item}
              onClick={() => {
                setSelectedProduct({
                  name: `Producto ${item}`,
                  price: 25,
                  img: IMAGEN,
                  images: [IMAGEN, IMAGEN, IMAGEN],
                  description: "Planta decorativa ideal para interiores 🌿"
                });
                setMode("home");
              }}
            >
              <img src={IMAGEN} alt={`Producto ${item}`} />
              <h3>Producto {item}</h3>
              <p>$25</p>
              <button className="btn">Ver</button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div>
            <h3>🌿 Concre Innova</h3>
            <p>Diseño ecológico para espacios modernos</p>
          </div>

          <div>
            <h4>Contacto</h4>
            <p>📧 correo@email.com</p>
            <p>📞 +506 0000-0000</p>
          </div>

          <div>
            <h4>Redes</h4>
            <p>Instagram</p>
            <p>Facebook</p>
            <p>TikTok</p>
          </div>
        </div>

        <p className="footer-copy">
          © 2026 Concre Innova - Todos los derechos reservados
        </p>
      </footer>

      {/* MODAL */}
      <ProductModal
        product={selectedProduct}
        mode={mode}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Home;
