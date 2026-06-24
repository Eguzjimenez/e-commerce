import { useEffect, useMemo, useState } from "react";
import IMAGEN from "../../img/Maceta-Negra.jpg";
import ProductModal from "../../components/ProductModal/ProductModal";
import Swal from "sweetalert2";
import {
  getCatalogCategories,
  getCatalogProducts,
  getProductImageCandidates,
} from "../../services/catalogService";
import { addToCart } from "../../services/cartService";
import "./Catalog.css";

function Catalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCatalogData() {
      setIsLoading(true);
      setError("");

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
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError.message || "No se pudo cargar el catalogo.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalogData();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          id: String(category.idCategoria ?? category.id ?? ""),
          name: category.nombreCategoria ?? category.nombre ?? "Sin nombre",
        }))
        .filter((category) => category.id),
    [categories]
  );

  const priceBounds = useMemo(() => {
    const prices = products
      .map((product) => Number(product.precio))
      .filter((price) => !Number.isNaN(price));

    if (prices.length === 0) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  useEffect(() => {
    setSelectedMinPrice(priceBounds.min);
    setSelectedMaxPrice(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const min = Number(selectedMinPrice);
    const max = Number(selectedMaxPrice);
    const hasMinPrice = !Number.isNaN(min);
    const hasMaxPrice = !Number.isNaN(max);

    return products.filter((product) => {
      const categoryId = String(product.idCategoria ?? "");
      const matchesCategory =
        selectedCategoryId === "all" || categoryId === selectedCategoryId;
      const productPrice = Number(product.precio) || 0;

      const matchesMinPrice = !hasMinPrice || productPrice >= min;
      const matchesMaxPrice = !hasMaxPrice || productPrice <= max;

      if (!matchesCategory || !matchesMinPrice || !matchesMaxPrice) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchableText = [
        product.nombre,
        product.descripcion,
        product.nombreCategoria,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [products, searchTerm, selectedCategoryId, selectedMinPrice, selectedMaxPrice]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId("all");
    setSelectedMinPrice(priceBounds.min);
    setSelectedMaxPrice(priceBounds.max);
  };

  const handleMinPriceChange = (event) => {
    const nextMin = Number(event.target.value);

    if (nextMin > selectedMaxPrice) {
      setSelectedMinPrice(selectedMaxPrice);
      return;
    }

    setSelectedMinPrice(nextMin);
  };

  const handleMaxPriceChange = (event) => {
    const nextMax = Number(event.target.value);

    if (nextMax < selectedMinPrice) {
      setSelectedMaxPrice(selectedMinPrice);
      return;
    }

    setSelectedMaxPrice(nextMax);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(Number(price) || 0);

  const formatColonNumber = (price) =>
    `₡${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price) || 0)}`;

  const buildModalProduct = (product) => {
    const imageCandidates = getProductImageCandidates(product.imagen);

    return {
      idProducto: product.idProducto,
      name: product.nombre,
      nombre: product.nombre,
      price: Number(product.precio) || 0,
      precio: Number(product.precio) || 0,
      img: imageCandidates[0] || IMAGEN,
      images: imageCandidates.length ? [...imageCandidates, IMAGEN] : [IMAGEN],
      description: product.descripcion,
      descripcion: product.descripcion,
      imagen: product.imagen,
      imageName: product.imagen,
      availability: product.disponibilidad,
      stock: Number(product.stock),
    };
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

  const handleImageFallback = (event, imageName) => {
    const imageElement = event.currentTarget;
    const imageCandidates = getProductImageCandidates(imageName);
    const currentIndex = Number(imageElement.dataset.candidateIndex || 0);
    const nextIndex = currentIndex + 1;

    if (nextIndex < imageCandidates.length) {
      imageElement.dataset.candidateIndex = String(nextIndex);
      imageElement.src = imageCandidates[nextIndex];
      return;
    }

    imageElement.onerror = null;
    imageElement.src = IMAGEN;
  };

  const getAvailabilityClass = (availability, stock) => {
    const stockNumber = Number(stock);
    const normalizedAvailabilityText = String(availability || "").trim().toLowerCase();

    if (normalizedAvailabilityText.includes("agotad") || stockNumber === 0) {
      return "catalog-stock--out";
    }

    if (normalizedAvailabilityText.includes("disponible")) {
      return "catalog-stock--in";
    }

    if (!Number.isNaN(stockNumber) || /^\d+/.test(normalizedAvailabilityText)) {
      return "catalog-stock--low";
    }

    return "catalog-stock--out";
  };

  const priceRangeSpan = Math.max(priceBounds.max - priceBounds.min, 1);
  const minPercent = ((selectedMinPrice - priceBounds.min) / priceRangeSpan) * 100;
  const maxPercent = ((selectedMaxPrice - priceBounds.min) / priceRangeSpan) * 100;

  return (
    <div className="container">
      <h1>Catálogo</h1>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="catalog-filters">
            <input
              className="input"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <div className="catalog-price-filter">
              <h3 className="catalog-price-title">Filtro Por Precio</h3>

              <div className="catalog-price-slider">
                <div className="catalog-price-slider-track" />
                <div
                  className="catalog-price-slider-range"
                  style={{
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                  }}
                />

                <input
                  className="catalog-range-input catalog-range-input--min"
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step="1"
                  value={selectedMinPrice}
                  onChange={handleMinPriceChange}
                  aria-label="Precio minimo"
                />

                <input
                  className="catalog-range-input catalog-range-input--max"
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step="1"
                  value={selectedMaxPrice}
                  onChange={handleMaxPriceChange}
                  aria-label="Precio maximo"
                />
              </div>

              <p className="catalog-price-label">
                Precio: {formatColonNumber(selectedMinPrice)} — {formatColonNumber(selectedMaxPrice)}
              </p>
            </div>

            <div
              className="catalog-categories"
              role="radiogroup"
              aria-label="Filtrar por categoria"
            >
              <label className="catalog-radio-option" htmlFor="category-all">
                <input
                  id="category-all"
                  type="radio"
                  name="catalog-category"
                  value="all"
                  checked={selectedCategoryId === "all"}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                />
                <span>Todas las categorias</span>
              </label>

              {normalizedCategories.map((category) => (
                <label
                  key={category.id}
                  className="catalog-radio-option"
                  htmlFor={`category-${category.id}`}
                >
                  <input
                    id={`category-${category.id}`}
                    type="radio"
                    name="catalog-category"
                    value={category.id}
                    checked={selectedCategoryId === category.id}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>

            <div className="catalog-filter-actions">
              <button type="button" className="btn" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>
          </div>
        </aside>

        <section className="catalog-results">
          {isLoading && <p className="catalog-status">Cargando catalogo...</p>}

          {!isLoading && error && <p className="catalog-error">{error}</p>}

          {!isLoading && !error && filteredProducts.length === 0 && (
            <p className="catalog-status">No se encontraron productos.</p>
          )}

          <div className="grid">
            {!isLoading &&
              !error &&
              filteredProducts.map((product) => (
                <div
                  className="card"
                  key={product.idProducto}
                  onClick={() => {
                    setSelectedProduct(buildModalProduct(product));
                    setMode("catalog");
                  }}
                >
                  <img
                    src={getProductImageCandidates(product.imagen)[0] || IMAGEN}
                    alt={product.nombre}
                    onError={(event) => handleImageFallback(event, product.imagen)}
                  />
                  <h3>{product.nombre}</h3>
                  <p>{formatPrice(product.precio)}</p>
                  <p
                    className={`catalog-stock ${getAvailabilityClass(
                      product.disponibilidad,
                      product.stock
                    )}`}
                  >
                    {product.disponibilidad}
                  </p>
                  <button
                    className="btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    Agregar
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>

      <ProductModal
        product={selectedProduct}
        mode={mode}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

export default Catalog;