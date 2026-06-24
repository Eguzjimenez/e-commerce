import IMAGEN from "../../img/Maceta-Negra.jpg";
import "./Home.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ROUTES } from "../../routes/routes";
import { getUserRole } from "../../services/authService";
import { isStaffRole, isVendorRole } from "../../constants/roleAccess";
import ProductModal from "../../components/ProductModal/ProductModal";

const homeSlides = [
  {
    label: "Nueva temporada",
    title: "Naturaleza seleccionada para interiores con caracter",
    text: "Plantas, flores y macetas listas para transformar salas, terrazas y espacios de trabajo.",
    highlight: "Coleccion interior",
  },
  {
    label: "Regalos verdes",
    title: "Detalles naturales con presentacion lista",
    text: "Sets curados para regalar sin complicarse: planta, maceta y acabado decorativo.",
    highlight: "Listo para entregar",
  },
  {
    label: "Espacios vivos",
    title: "Piezas simples para renovar ambientes",
    text: "Diseno funcional, materiales sobrios y productos faciles de integrar al hogar.",
    highlight: "Bajo cuidado",
  },
];

const productGroups = ["Todos", "Interior", "Regalos", "Terraza"];

const featuredProducts = [
  {
    id: 1,
    name: "Maceta Nilo",
    price: 25,
    group: "Interior",
    category: "Macetas",
    rating: "4.8",
    description: "Maceta decorativa para interiores modernos.",
  },
  {
    id: 2,
    name: "Palma Serena",
    price: 35,
    group: "Interior",
    category: "Plantas",
    rating: "4.9",
    description: "Planta natural para salas, oficinas y entradas.",
  },
  {
    id: 3,
    name: "Ramo Alba",
    price: 28,
    group: "Regalos",
    category: "Flores",
    rating: "4.7",
    description: "Arreglo floral listo para regalar.",
  },
  {
    id: 4,
    name: "Set Terra",
    price: 42,
    group: "Regalos",
    category: "Set",
    rating: "4.8",
    description: "Set decorativo con maceta y planta de bajo cuidado.",
  },
  {
    id: 5,
    name: "Maceta Orion",
    price: 32,
    group: "Terraza",
    category: "Macetas",
    rating: "4.8",
    description: "Maceta resistente para balcones y terrazas.",
  },
  {
    id: 6,
    name: "Helecho Bruma",
    price: 29,
    group: "Terraza",
    category: "Plantas",
    rating: "4.7",
    description: "Helecho decorativo ideal para espacios frescos.",
  },
];

function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("home");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeGroup, setActiveGroup] = useState("Todos");
  const userRole = getUserRole();
  const showStaffAccess = isStaffRole(userRole);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % homeSlides.length);
    }, 5600);

    return () => clearInterval(slideTimer);
  }, []);

  const visibleProducts = useMemo(() => {
    if (activeGroup === "Todos") {
      return featuredProducts;
    }

    return featuredProducts.filter((product) => product.group === activeGroup);
  }, [activeGroup]);

  const currentSlide = homeSlides[activeSlide];

  const openProduct = (product) => {
    setSelectedProduct({
      name: product.name,
      price: product.price,
      img: IMAGEN,
      images: [IMAGEN, IMAGEN, IMAGEN],
      description: product.description,
    });
    setMode("home");
  };

  const showNextSlide = () => {
    setActiveSlide((currentSlideIndex) => (currentSlideIndex + 1) % homeSlides.length);
  };

  const showPreviousSlide = () => {
    setActiveSlide((currentSlideIndex) =>
      currentSlideIndex === 0 ? homeSlides.length - 1 : currentSlideIndex - 1
    );
  };

  return (
    <div className="home-page">
      <section className="home-showcase">
        <div className="home-showcase-copy">
          <span className="home-eyebrow">{currentSlide.label}</span>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.text}</p>

          <div className="home-showcase-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setActiveGroup("Todos")}
            >
              Ver seleccion
            </button>
            <button
              type="button"
              className="home-ghost-btn"
              onClick={() => setActiveGroup("Regalos")}
            >
              Ver regalos
            </button>
          </div>
        </div>

        <div className="home-feature-panel" aria-label="Destacado de temporada">
          <button
            type="button"
            className="home-carousel-control previous"
            onClick={showPreviousSlide}
            aria-label="Ver destacado anterior"
          >
            {"<"}
          </button>

          <div className="home-feature-card" key={currentSlide.title}>
            <div className="home-feature-image">
              <span>{currentSlide.highlight}</span>
              <img src={IMAGEN} alt={currentSlide.highlight} />
            </div>

            <div className="home-feature-content">
              <span>Concre Innova</span>
              <strong>{currentSlide.label}</strong>
            </div>
          </div>

          <button
            type="button"
            className="home-carousel-control next"
            onClick={showNextSlide}
            aria-label="Ver siguiente destacado"
          >
            {">"}
          </button>

          <div className="home-carousel-dots" aria-label="Seleccionar destacado">
            {homeSlides.map((slide, index) => (
              <button
                type="button"
                key={slide.title}
                className={activeSlide === index ? "active" : ""}
                onClick={() => setActiveSlide(index)}
                aria-label={`Ver ${slide.label}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container home-story">
        <div>
          <span className="home-section-kicker">Sobre nosotros</span>
          <h2>Diseno natural sin exceso visual</h2>
        </div>
        <p>
          En Concre Innova creamos piezas que combinan naturaleza, forma y uso diario.
          La seleccion se enfoca en productos faciles de integrar a hogares, oficinas y
          regalos.
        </p>
      </section>

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

      <section className="container featured-section">
        <div className="section-title-row">
          <div>
            <span className="home-section-kicker">Colecciones</span>
            <h2>Productos destacados</h2>
            <p>Seleccion visual para plantas, flores y macetas decorativas.</p>
          </div>

          <div className="home-product-tabs" aria-label="Filtrar productos destacados">
            {productGroups.map((group) => (
              <button
                type="button"
                key={group}
                className={activeGroup === group ? "active" : ""}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="grid home-product-grid">
          {visibleProducts.map((product, index) => (
            <div
              className="card product-card-modern home-product-card"
              key={product.id}
              style={{ "--card-index": index }}
              onClick={() => openProduct(product)}
            >
              <div className="product-visual">
                <span className="product-rating">{product.rating}</span>
                <img src={IMAGEN} alt={product.name} />
              </div>

              <div className="product-card-body">
                <span className="product-category">
                  {product.group} | {product.category}
                </span>
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <button
                  className="btn"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openProduct(product);
                  }}
                >
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div>
            <h3>Concre Innova</h3>
            <p>Diseno ecologico para espacios modernos</p>
          </div>

          <div>
            <h4>Contacto</h4>
            <p>correo@email.com</p>
            <p>+506 0000-0000</p>
          </div>

          <div>
            <h4>Redes</h4>
            <p>Instagram</p>
            <p>Facebook</p>
            <p>TikTok</p>
          </div>
        </div>

        <p className="footer-copy">
          2026 Concre Innova - Todos los derechos reservados
        </p>
      </footer>

      <ProductModal
        product={selectedProduct}
        mode={mode}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Home;
