import "./Home.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { PUBLIC_ROUTES } from "../../routes/routes";
import ProductModal from "../../components/ProductModal/ProductModal";
import { getCatalogProducts } from "../../services/catalogService";
import { addToCart } from "../../services/cartService";
import heroBotanicalImage from "../../img/Hero-background.png";
import macetaNoirImage from "../../img/Maceta-Negra.jpg";
import {
  buildCatalogModalProduct,
  formatCatalogPrice,
  getCatalogProductImage,
  getFeaturedCatalogProducts,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";

const homeSlides = [
  {
    label: "Floristeria y macetas - San Miguel Oeste",
    title: "Concre Innova",
    text: "Piezas botanicas, flores y macetas seleccionadas para hogares, terrazas y espacios que buscan una presencia natural, sobria y duradera.",
    highlight: "Asesoria directa",
  },
  {
    label: "Regalos vivos",
    title: "Detalles naturales listos para entregar",
    text: "Sets curados para regalar con planta, maceta, tarjeta y una preparacion cuidada desde Naranjo.",
    highlight: "Listo para regalo",
  },
  {
    label: "Espacios con calma",
    title: "Naturaleza sobria para interiores",
    text: "Plantas y macetas elegidas por luz, material y uso para integrarse sin exceso visual.",
    highlight: "Bajo cuidado",
  },
];

const collectionCards = [
  {
    title: "Macetas de autor",
    text: "Concreto, ceramica y acabados sobrios",
    image: macetaNoirImage,
  },
  {
    title: "Flores de temporada",
    text: "Ramos y detalles naturales preparados",
    image: heroBotanicalImage,
  },
  {
    title: "Plantas interiores",
    text: "Seleccion para salas, oficinas y terrazas",
    image: macetaNoirImage,
  },
  {
    title: "Regalos vivos",
    text: "Set curado: planta, maceta y tarjeta",
    image: heroBotanicalImage,
  },
];

const storyPhotos = [
  ["Fachada o entrada del local", macetaNoirImage],
  ["Mesa de trabajo y preparacion", heroBotanicalImage],
  ["Entorno natural de Naranjo", heroBotanicalImage],
  ["Detalle de macetas y plantas", macetaNoirImage],
];

function Home() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("home");
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

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
        const productsResponse = await getCatalogProducts();

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      } catch (error) {
        if (isMounted) {
          setProductsError(error.message || "No se pudieron cargar los productos destacados.");
          setProducts([]);
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

  const featuredProducts = useMemo(
    () => getFeaturedCatalogProducts(products, 6),
    [products]
  );

  const currentSlide = homeSlides[activeSlide];
  const featuredHeroProduct =
    featuredProducts[activeSlide % Math.max(featuredProducts.length, 1)];

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
      <section className="home-hero">
        <img className="home-hero-image" src={heroBotanicalImage} alt="" aria-hidden="true" />
        <div className="home-hero-overlay" />

        <div className="home-hero-content">
          <span className="home-eyebrow">{currentSlide.label}</span>
          <h1>{currentSlide.title}</h1>
          <p>{currentSlide.text}</p>

          <div className="home-showcase-actions">
            <Link to={PUBLIC_ROUTES.CATALOG} className="btn">
              Explorar catalogo
            </Link>
            <Link to={PUBLIC_ROUTES.CATALOG} className="home-ghost-btn">
              Armar regalo
            </Link>
          </div>

        </div>

        <div className="home-hero-carousel" aria-label="Destacado de temporada">
          <div className="home-carousel-progress" key={`slide-progress-${activeSlide}`}>
            <span />
          </div>

          <button
            type="button"
            className="home-carousel-control previous"
            onClick={showPreviousSlide}
            aria-label="Ver destacado anterior"
          >
            {"<"}
          </button>

          <div
            className="home-feature-card"
            key={`${currentSlide.title}-${featuredHeroProduct?.idProducto || activeSlide}`}
          >
            <figure className="home-feature-media">
              <img
                src={
                  featuredHeroProduct
                    ? getCatalogProductImage(featuredHeroProduct)
                    : macetaNoirImage
                }
                alt={featuredHeroProduct?.nombre || "Seleccion botanica"}
                onError={(event) => {
                  if (featuredHeroProduct) {
                    handleCatalogImageFallback(event, featuredHeroProduct.imagen);
                  }
                }}
              />
            </figure>

            <div className="home-feature-copy">
              <span>{currentSlide.highlight}</span>
              <strong>{featuredHeroProduct?.nombre || "Seleccion botanica"}</strong>
              <small>
                {featuredHeroProduct
                  ? formatCatalogPrice(featuredHeroProduct.precio)
                  : "Macetas, plantas y flores"}
              </small>
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
                key={slide.label}
                className={activeSlide === index ? "active" : ""}
                onClick={() => setActiveSlide(index)}
                aria-label={`Ver ${slide.label}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-collections">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">Colecciones</span>
            <h2>Comprar por intencion</h2>
          </div>
          <p>
            La experiencia prioriza decisiones claras: decorar, regalar, renovar o cuidar.
            Cada coleccion puede mapearse a categorias existentes del catalogo.
          </p>
        </div>

        <div className="home-collection-grid">
          {collectionCards.map((collection) => (
            <Link
              className="home-collection-card"
              key={collection.title}
              to={PUBLIC_ROUTES.CATALOG}
            >
              <img src={collection.image} alt="" aria-hidden="true" />
              <div>
                <h3>{collection.title}</h3>
                <p>{collection.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section home-story">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">Nosotros</span>
            <h2>Un lugar que define nuestra forma de cuidar</h2>
          </div>
          <p>
            La propuesta habla del espacio fisico, del origen y de la experiencia de
            visitar. Aqui el relato se vuelve local, sereno y cercano a San Miguel
            Oeste de Naranjo.
          </p>
        </div>

        <div className="home-story-layout">
          <div className="home-story-photo">
            <img src={heroBotanicalImage} alt="Macetas y plantas en un espacio exterior" />
            <span>Foto real del lugar</span>
            <p>Entorno verde, luz natural y macetas como parte de la experiencia de visita.</p>
          </div>

          <article className="home-story-panel">
            <span>Raices</span>
            <h3>Del oficio al detalle vivo</h3>
            <p>
              Las raices de la marca se cuentan desde el cuidado diario: seleccionar
              plantas sanas, preparar macetas duraderas y convertir flores en gestos
              memorables.
            </p>
          </article>

          <article className="home-story-panel dark">
            <span>San Miguel Oeste</span>
            <h3>Una tienda pensada desde el paisaje</h3>
            <p>
              Naranjo permite construir una experiencia mas calmada: verde cercano,
              ritmo local y productos elegidos para hogares que buscan naturaleza sin
              exceso visual.
            </p>
          </article>
        </div>

        <div className="home-story-gallery">
          {storyPhotos.map(([caption, image]) => (
            <figure key={caption}>
              <img src={image} alt="" aria-hidden="true" />
              <figcaption>
                <strong>{caption}</strong>
                <span>Reemplazar por fotografia real</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="home-section featured-section" id="productos-destacados">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">Seleccion destacada</span>
            <h2>Piezas con presencia natural</h2>
          </div>
          <p>
            Cards reducen decoracion y tratan cada item como un objeto de cuidado.
            Precio, material y disponibilidad se mantienen claros.
          </p>
        </div>

        {isLoadingProducts && (
          <p className="home-products-status">Cargando productos destacados...</p>
        )}

        {!isLoadingProducts && productsError && (
          <p className="home-products-error">{productsError}</p>
        )}

        {!isLoadingProducts && !productsError && (
          <div className="home-product-grid">
            {featuredProducts.map((product, index) => (
              <article
                className="home-product-card"
                key={product.idProducto}
                style={{ "--card-index": index }}
                onClick={() => openProduct(product)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openProduct(product);
                  }
                }}
              >
                <div className="product-visual">
                  <img
                    src={getCatalogProductImage(product)}
                    alt={product.nombre}
                    onError={(event) => handleCatalogImageFallback(event, product.imagen)}
                  />
                </div>

                <div className="product-card-body">
                  <h3>{product.nombre}</h3>
                  <p className="home-product-price">{formatCatalogPrice(product.precio)}</p>
                </div>
              </article>
            ))}

            {featuredProducts.length === 0 && (
              <div className="home-products-empty">
                No hay productos destacados disponibles.
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="footer home-footer">
        <div className="home-footer-top">
          <div>
            <span>Identidad local</span>
            <h2>Desde San Miguel Oeste de Naranjo</h2>
          </div>
          <p>
            La marca se presenta como una experiencia cercana y confiable: seleccion
            botanica, asesoria de cuidado, preparacion de regalos y entrega local con
            una estetica de calidad.
          </p>
        </div>

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
    </div>
  );
}

export default Home;
