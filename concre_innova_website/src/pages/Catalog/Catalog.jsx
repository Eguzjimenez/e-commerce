import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import ProductModal from "../../components/ProductModal/ProductModal";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "../../services/catalogService";
import { addToCart, getCart } from "../../services/cartService";
import {
  buildCatalogModalProduct,
  formatCatalogPrice,
  getCatalogProductAvailabilityClass,
  getCatalogProductAvailabilityText,
  getCatalogProductCategoryName,
  getCatalogProductImage,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";
import { PRIVATE_ROUTES } from "../../routes/routes";
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
  const [cartItems, setCartItems] = useState([]);
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
        if (isMounted) {
          setError(loadError.message || "No se pudo cargar el catalogo.");
        }
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

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCart());
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categories),
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

  const activeCategoryName =
    selectedCategoryId === "all"
      ? "Todos"
      : normalizedCategories.find((category) => category.id === selectedCategoryId)?.name ||
        "Categoria";

  const cartSubtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (Number(item.precio) || 0) * (Number(item.cantidad) || 1),
        0
      ),
    [cartItems]
  );

  const cartPreview = cartItems.slice(0, 3);

  const priceRangeSpan = Math.max(priceBounds.max - priceBounds.min, 1);
  const minPercent = ((selectedMinPrice - priceBounds.min) / priceRangeSpan) * 100;
  const maxPercent = ((selectedMaxPrice - priceBounds.min) / priceRangeSpan) * 100;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId("all");
    setSelectedMinPrice(priceBounds.min);
    setSelectedMaxPrice(priceBounds.max);
  };

  const handleMinPriceChange = (event) => {
    const nextMin = Number(event.target.value);
    setSelectedMinPrice(Math.min(nextMin, selectedMaxPrice));
  };

  const handleMaxPriceChange = (event) => {
    const nextMax = Number(event.target.value);
    setSelectedMaxPrice(Math.max(nextMax, selectedMinPrice));
  };

  const openProduct = (product) => {
    setSelectedProduct(buildCatalogModalProduct(product));
    setMode("catalog");
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

  return (
    <div className="catalog-page catalog-shop">
      <section className="catalog-shop-header">
        <div>
          <h1>Catalogo</h1>
          <p>Filtros visibles, busqueda clara y carrito persistente.</p>
        </div>

        <input
          className="input catalog-shop-search"
          placeholder="Buscar plantas, flores o macetas"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </section>

      <section className="catalog-shop-layout">
        <aside className="catalog-filter-panel" aria-label="Filtros de catalogo">
          <h2>Filtros</h2>

          <div className="catalog-filter-list" role="radiogroup" aria-label="Categoria">
            <button
              type="button"
              className={selectedCategoryId === "all" ? "active" : ""}
              onClick={() => setSelectedCategoryId("all")}
            >
              <span />
              Todas
            </button>

            {normalizedCategories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={selectedCategoryId === category.id ? "active" : ""}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                <span />
                {category.name}
              </button>
            ))}
          </div>

          <div className="catalog-price-filter">
            <strong>Rango de precio</strong>
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
              {formatCatalogPrice(selectedMinPrice)} - {formatCatalogPrice(selectedMaxPrice)}
            </p>
          </div>

          <button type="button" className="catalog-clear-button" onClick={clearFilters}>
            Limpiar seleccion
          </button>
        </aside>

        <div className="catalog-product-area">
          <div className="catalog-product-toolbar">
            <span>
              {filteredProducts.length} producto
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>
            <div>{activeCategoryName}</div>
          </div>

          {isLoading && <p className="catalog-status">Cargando catalogo...</p>}
          {!isLoading && error && <p className="catalog-error">{error}</p>}

          {!isLoading && !error && (
            <div className="catalog-product-grid">
              {filteredProducts.map((product, index) => (
                  <article
                    className="catalog-shop-card"
                    key={product.idProducto}
                    style={{ "--card-index": index }}
                    onClick={() => openProduct(product)}
                  >
                    <div className="catalog-card-visual">
                      <span className="product-rating">
                        {getCatalogProductAvailabilityText(product)}
                      </span>
                      <img
                        src={getCatalogProductImage(product)}
                        alt={product.nombre}
                        className="catalog-card-image"
                        onError={(event) => handleCatalogImageFallback(event, product.imagen)}
                      />
                    </div>

                    <div className="catalog-card-body">
                      <span className="product-category">
                        {getCatalogProductCategoryName(product, normalizedCategories)}
                      </span>
                      <h3>{product.nombre}</h3>
                      <p>{product.descripcion || "Producto para interiores y exteriores."}</p>
                      <p className={`catalog-stock ${getCatalogProductAvailabilityClass(product)}`}>
                        {getCatalogProductAvailabilityText(product)}
                      </p>

                      <div className="catalog-card-footer">
                        <strong>{formatCatalogPrice(product.precio)}</strong>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleAddToCart(buildCatalogModalProduct(product));
                          }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}

              {filteredProducts.length === 0 && (
                <div className="catalog-empty">
                  <h3>No hay productos con esos filtros</h3>
                  <p>Prueba otra categoria o limpia la busqueda.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="catalog-cart-panel" aria-label="Resumen de carrito">
          <div className="catalog-cart-header">
            <h2>Carrito</h2>
            <span>
              {cartItems.length} producto{cartItems.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="catalog-cart-list">
            {cartPreview.map((product, index) => (
              <div className="catalog-cart-item" key={product.idProducto}>
                <span className={`cart-color cart-color-${(index % 3) + 1}`} />
                <div>
                  <strong>{product.nombre}</strong>
                  <p>{formatCatalogPrice(product.precio)}</p>
                </div>
              </div>
            ))}

            {cartPreview.length === 0 && (
              <p className="catalog-cart-empty">Aun no hay productos agregados.</p>
            )}
          </div>

          <div className="catalog-cart-total">
            <span>Subtotal</span>
            <strong>{formatCatalogPrice(cartSubtotal)}</strong>
          </div>

          <Link to={PRIVATE_ROUTES.CART} className="catalog-checkout-button">
            Ver carrito
          </Link>
        </aside>
      </section>

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
