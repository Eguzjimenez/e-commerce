import "./Home.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { ADMIN_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { getUserRole } from "../../services/authService";
import { isAdminRole } from "../../constants/roleAccess";
import ProductModal from "../../components/ProductModal/ProductModal";
import { getCatalogCategories, getCatalogProducts } from "../../services/catalogService";
import { addToCart } from "../../services/cartService";
import {
  buildCatalogModalProduct,
  formatCatalogPrice,
  getCatalogProductAvailabilityText,
  getCatalogProductCategoryName,
  getCatalogProductImage,
  getFeaturedCatalogProducts,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";
import ChatBot from "../Chat/Chat";

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

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("home");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const userRole = getUserRole();
  const showAdminAccess = isAdminRole(userRole);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % homeSlides.length);
    }, 5600);

    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProducts() {
      setIsLoadingProducts(true);
      setProductsError("");

      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          getCatalogProducts(),
          getCatalogCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productsResponse) ? productsResponse : []);
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      } catch (error) {
        if (isMounted) {
          setProductsError(error.message || "No se pudieron cargar los productos destacados.");
          setProducts([]);
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    }

    loadFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categories),
    [categories]
  );

  const featuredProducts = useMemo(
    () => getFeaturedCatalogProducts(products, 6),
    [products]
  );

  const currentSlide = homeSlides[activeSlide];
  const featuredHeroProduct = featuredProducts[activeSlide % Math.max(featuredProducts.length, 1)];

  const openProduct = (product) => {
    setSelectedProduct(buildCatalogModalProduct(product));
    setMode("home");
  };

  const handleAddToCart = async (product) => {
    addToCart(product, 1);

    await Swal.fire({
      icon: "success",
      title: "Agregado al carrito",
      text: `${product.nombre || product.name} fue agregado correctamente.`,
      timer: 1400,
      showConfirmButton: false,
    });
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
            <a href="#productos-destacados" className="btn">
              Ver seleccion
            </a>
            <Link to={PUBLIC_ROUTES.CATALOG} className="home-ghost-btn">
              Ver catalogo
            </Link>
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
              <img
                src={
                  featuredHeroProduct
                    ? getCatalogProductImage(featuredHeroProduct)
                    : getCatalogProductImage({})
                }
                alt={featuredHeroProduct?.nombre || currentSlide.highlight}
                onError={(event) =>
                  handleCatalogImageFallback(event, featuredHeroProduct?.imagen)
                }
              />
            </div>

            <div className="home-feature-content">
              <span>Concre Innova</span>
              <strong>{featuredHeroProduct?.nombre || currentSlide.label}</strong>
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

      {showAdminAccess && (
        <section className="container admin-home-access">
          <div className="admin-home-card">
            <div className="admin-home-card-content">
              <span className="admin-home-badge">Acceso interno</span>
              <h2>Panel de administracion</h2>
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

      <section className="container featured-section" id="productos-destacados">
        <div className="section-title-row">
          <div>
            <span className="home-section-kicker">Colecciones</span>
            <h2>Productos destacados</h2>
            <p>Seleccion visual para plantas, flores y macetas decorativas.</p>
          </div>
        </div>

        {isLoadingProducts && (
          <p className="home-products-status">Cargando productos destacados...</p>
        )}

        {!isLoadingProducts && productsError && (
          <p className="home-products-error">{productsError}</p>
        )}

        {!isLoadingProducts && !productsError && (
          <div className="grid home-product-grid">
            {featuredProducts.map((product, index) => (
              <div
                className="card product-card-modern home-product-card"
                key={product.idProducto}
                style={{ "--card-index": index }}
                onClick={() => openProduct(product)}
              >
                <div className="product-visual">
                  <span className="product-rating">
                    {getCatalogProductAvailabilityText(product)}
                  </span>
                  <img
                    src={getCatalogProductImage(product)}
                    alt={product.nombre}
                    onError={(event) => handleCatalogImageFallback(event, product.imagen)}
                  />
                </div>

                <div className="product-card-body">
                  <span className="product-category">
                    {getCatalogProductCategoryName(product, normalizedCategories)}
                  </span>
                  <h3>{product.nombre}</h3>
                  <p>{formatCatalogPrice(product.precio)}</p>
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

            {featuredProducts.length === 0 && (
              <div className="home-products-empty">
                No hay productos destacados disponibles.
              </div>
            )}
          </div>
        )}
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
        onAddToCart={handleAddToCart}
      />

      <ChatBot />
    </div>
  );
}

export default Home;
