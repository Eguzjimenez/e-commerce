import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "../../services/catalogService";
import { addToCart, getCart } from "../../services/cartService";
import {
  getFavoriteProductIds,
  toggleFavorite,
} from "../../services/favoriteService";
import {
  buildCatalogModalProduct,
  filterAndSortCatalogProducts,
  formatCatalogPrice,
  getCatalogQueryOptions,
  getCatalogProductAvailabilityClass,
  getCatalogProductAvailabilityText,
  getCatalogProductCategoryName,
  getCatalogProductImage,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
  PRODUCT_SORT_OPTIONS,
} from "../../services/catalogPresentationService";
import { buildProductDetailRoute, PRIVATE_ROUTES } from "../../routes/routes";
import "./Catalog.css";

function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedSortOrder, setSelectedSortOrder] = useState(PRODUCT_SORT_OPTIONS.NONE);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const categoriesResponse = await getCatalogCategories();

        if (!isMounted) {
          return;
        }

        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "No se pudieron cargar las categorias.");
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const searchDelay = searchTerm.trim() ? 350 : 0;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const productsResponse = await getCatalogProducts(
          getCatalogQueryOptions(searchTerm, selectedSortOrder)
        );

        if (!isMounted) {
          return;
        }

        setProducts(Array.isArray(productsResponse) ? productsResponse : []);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "No se pudo cargar el catalogo.");
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }, searchDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, selectedSortOrder]);

  useEffect(() => {
    const syncCart = () => {
      setCartItems(getCart());
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  useEffect(() => {
    const syncFavorites = () => {
      setFavoriteProductIds(new Set(getFavoriteProductIds()));
    };

    syncFavorites();
    window.addEventListener("favoriteschange", syncFavorites);

    return () => window.removeEventListener("favoriteschange", syncFavorites);
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
    return filterAndSortCatalogProducts(products, {
      searchTerm,
      selectedCategoryId,
      selectedMinPrice,
      selectedMaxPrice,
      selectedSortOrder,
    });
  }, [
    products,
    searchTerm,
    selectedCategoryId,
    selectedMinPrice,
    selectedMaxPrice,
    selectedSortOrder,
  ]);

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
    setSelectedSortOrder(PRODUCT_SORT_OPTIONS.NONE);
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
    navigate(buildProductDetailRoute(product.idProducto));
  };

  const handleToggleFavorite = async (event, product) => {
    event.stopPropagation();
    const result = toggleFavorite(product);
    setFavoriteProductIds(new Set(result.favorites.map((favorite) => favorite.idProducto)));

    await Swal.fire({
      icon: "success",
      title: result.isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
      text: result.isFavorite
        ? `${product.nombre} fue guardado en favoritos.`
        : `${product.nombre} fue removido de favoritos.`,
      timer: 1300,
      showConfirmButton: false,
    });
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

        <form
          className="catalog-shop-search-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <input
            className="input catalog-shop-search"
            placeholder="Buscar plantas, flores o macetas"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit">Buscar</button>
        </form>
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
            <div className="catalog-toolbar-controls">
              <span>{activeCategoryName}</span>
              <select
                value={selectedSortOrder}
                onChange={(event) => setSelectedSortOrder(event.target.value)}
                aria-label="Ordenar productos"
              >
                <option value={PRODUCT_SORT_OPTIONS.NONE}>Orden original</option>
                <option value={PRODUCT_SORT_OPTIONS.PRICE_ASC}>Precio: menor a mayor</option>
                <option value={PRODUCT_SORT_OPTIONS.PRICE_DESC}>Precio: mayor a menor</option>
              </select>
            </div>
          </div>

          {isLoading && <p className="catalog-status">Cargando catalogo...</p>}
          {!isLoading && error && <p className="catalog-error">{error}</p>}

          {!isLoading && !error && (
            <div className="catalog-product-grid">
              {filteredProducts.map((product, index) => {
                const isFavorite = favoriteProductIds.has(Number(product.idProducto));
                return (
                  <article
                    className="catalog-shop-card"
                    key={product.idProducto}
                    style={{ "--card-index": index }}
                    onClick={() => openProduct(product)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && event.target === event.currentTarget) {
                        openProduct(product);
                      }
                    }}
                    tabIndex={0}
                  >
                    <div className="catalog-card-visual">
                      <span className="product-rating">
                        {getCatalogProductAvailabilityText(product)}
                      </span>
                      <button
                        type="button"
                        className={`catalog-favorite-button ${isFavorite ? "active" : ""}`}
                        aria-label={
                          isFavorite
                            ? `Eliminar ${product.nombre} de favoritos`
                            : `Agregar ${product.nombre} a favoritos`
                        }
                        aria-pressed={isFavorite}
                        onClick={(event) => handleToggleFavorite(event, product)}
                      >
                        {isFavorite ? "\u2665" : "\u2661"}
                      </button>
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
                );
              })}

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

    </div>
  );
}

export default Catalog;
