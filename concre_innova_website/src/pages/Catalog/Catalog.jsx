import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, SlidersHorizontal, X } from "lucide-react";
import Swal from "sweetalert2";
import {
  getCatalogFilters,
  getCatalogProducts,
} from "../../services/catalogService";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import {
  getFavoriteProductIdsAsync,
  toggleFavorite,
} from "../../services/favoriteService";
import {
  CATALOG_FILTER_OPTIONS,
  filterAndSortCatalogProducts,
  buildCatalogProductSummary,
  formatCatalogPrice,
  getCatalogQueryOptions,
  getCatalogProductImage,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
  normalizeCatalogTypes,
  PRODUCT_SORT_OPTIONS,
} from "../../services/catalogPresentationService";
import { DEFAULT_PAGINATION, normalizePaginatedResponse } from "../../services/paginationService";
import { buildProductDetailRoute } from "../../routes/routes";
import "./Catalog.css";

const CATALOG_PAGE_SIZE = 9;

const CATALOG_SORT_FILTER_OPTIONS = [
  { value: PRODUCT_SORT_OPTIONS.NONE, label: "Orden original" },
  { value: PRODUCT_SORT_OPTIONS.PRICE_ASC, label: "Precio menor a mayor" },
  { value: PRODUCT_SORT_OPTIONS.PRICE_DESC, label: "Precio mayor a menor" },
];

function isAbortError(error) {
  return error?.name === "AbortError";
}

function getCatalogFilterPriceBounds(filterResponse) {
  const min = Number(filterResponse?.precioMinimo ?? filterResponse?.PrecioMinimo) || 0;
  const max = Number(filterResponse?.precioMaximo ?? filterResponse?.PrecioMaximo) || 0;

  return {
    min,
    max: Math.max(min, max),
  };
}

function Catalog() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialSearchTerm = new URLSearchParams(location.search).get("search") || "";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedSortOrder, setSelectedSortOrder] = useState(PRODUCT_SORT_OPTIONS.NONE);
  const [selectedMinPrice, setSelectedMinPrice] = useState(0);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(0);
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [selectedTypeId, setSelectedTypeId] = useState("all");
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersReady, setFiltersReady] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    pageSize: CATALOG_PAGE_SIZE,
  });

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function loadCatalogFilterData() {
      try {
        const filterResponse = await getCatalogFilters({
          signal: abortController.signal,
        });

        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        const categoriesResponse = filterResponse?.categorias ?? filterResponse?.Categorias ?? [];
        const typesResponse =
          filterResponse?.tiposProducto ?? filterResponse?.TiposProducto ?? [];
        const nextPriceBounds = getCatalogFilterPriceBounds(filterResponse);

        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
        setProductTypes(Array.isArray(typesResponse) ? typesResponse : []);
        setPriceBounds(nextPriceBounds);
        setSelectedMinPrice(nextPriceBounds.min);
        setSelectedMaxPrice(nextPriceBounds.max);
      } catch (loadError) {
        if (isMounted && !isAbortError(loadError)) {
          setError(loadError.message || "No se pudieron cargar las categorias.");
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setFiltersReady(true);
        }
      }
    }

    loadCatalogFilterData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const nextSearchTerm = new URLSearchParams(location.search).get("search") || "";
    setSearchTerm(nextSearchTerm);
    setCatalogPage(1);
  }, [location.search]);

  useEffect(() => {
    if (!filterDrawerOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setFilterDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filterDrawerOpen]);

  useEffect(() => {
    if (!filtersReady) {
      return undefined;
    }

    let isMounted = true;
    const abortController = new AbortController();
    const searchDelay = searchTerm.trim() ? 350 : 0;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const queryOptions = getCatalogQueryOptions({
          searchTerm,
          selectedSortOrder,
          selectedCategoryId,
          selectedMinPrice,
          selectedMaxPrice,
          selectedAvailability,
          selectedSize,
          selectedMaterial,
          selectedTypeId,
          priceBounds,
        });
        const productsResponse = await getCatalogProducts({
          ...queryOptions,
          page: catalogPage,
          pageSize: CATALOG_PAGE_SIZE,
          signal: abortController.signal,
        });

        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        const pagedProducts = normalizePaginatedResponse(
          productsResponse,
          catalogPage,
          CATALOG_PAGE_SIZE
        );
        setProducts(pagedProducts.items);
        setPagination(pagedProducts);
      } catch (loadError) {
        if (isMounted && !isAbortError(loadError)) {
          setError(loadError.message || "No se pudo cargar el catalogo.");
          setProducts([]);
          setPagination({
            ...DEFAULT_PAGINATION,
            pageNumber: catalogPage,
            pageSize: CATALOG_PAGE_SIZE,
          });
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
      abortController.abort();
    };
  }, [
    searchTerm,
    selectedSortOrder,
    selectedCategoryId,
    selectedMinPrice,
    selectedMaxPrice,
    selectedAvailability,
    selectedSize,
    selectedMaterial,
    selectedTypeId,
    priceBounds,
    catalogPage,
    filtersReady,
  ]);

  useEffect(() => {
    const syncFavorites = async () => {
      try {
        const favoriteIds = await getFavoriteProductIdsAsync();
        setFavoriteProductIds(new Set(favoriteIds));
      } catch {
        setFavoriteProductIds(new Set());
      }
    };

    syncFavorites();
    const handleFavoritesChange = () => {
      syncFavorites();
    };

    window.addEventListener("favoriteschange", handleFavoritesChange);

    return () => window.removeEventListener("favoriteschange", handleFavoritesChange);
  }, []);

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categories),
    [categories]
  );

  const normalizedProductTypes = useMemo(
    () => normalizeCatalogTypes(productTypes),
    [productTypes]
  );

  const filteredProducts = useMemo(() => {
    return filterAndSortCatalogProducts(products);
  }, [products]);

  const activeCategoryName =
    selectedCategoryId === "all"
      ? "Todos"
      : normalizedCategories.find((category) => category.id === selectedCategoryId)?.name ||
        "Categoria";

  const priceRangeSpan = Math.max(priceBounds.max - priceBounds.min, 1);
  const minPercent = ((selectedMinPrice - priceBounds.min) / priceRangeSpan) * 100;
  const maxPercent = ((selectedMaxPrice - priceBounds.min) / priceRangeSpan) * 100;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId("all");
    setSelectedSortOrder(PRODUCT_SORT_OPTIONS.NONE);
    setSelectedMinPrice(priceBounds.min);
    setSelectedMaxPrice(priceBounds.max);
    setSelectedAvailability("all");
    setSelectedSize("all");
    setSelectedMaterial("all");
    setSelectedTypeId("all");
    setCatalogPage(1);
  };

  const handleMinPriceChange = (event) => {
    const nextMin = Number(event.target.value);
    setSelectedMinPrice(Math.min(nextMin, selectedMaxPrice));
    setCatalogPage(1);
  };

  const handleMaxPriceChange = (event) => {
    const nextMax = Number(event.target.value);
    setSelectedMaxPrice(Math.max(nextMax, selectedMinPrice));
    setCatalogPage(1);
  };

  const openProduct = (product) => {
    navigate(buildProductDetailRoute(product.idProducto));
  };

  const handleToggleFavorite = async (event, product) => {
    event.stopPropagation();
    const result = await toggleFavorite(product);
    setFavoriteProductIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const idProducto = Number(result.idProducto ?? product.idProducto);

      if (result.isFavorite) {
        nextIds.add(idProducto);
      } else {
        nextIds.delete(idProducto);
      }

      return nextIds;
    });

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

  return (
    <div className="catalog-page catalog-shop">
      <section className="catalog-collection-header" aria-labelledby="catalog-title">
        <div>
          <span className="catalog-collection-kicker">{activeCategoryName}</span>
          <h1 id="catalog-title">
            Catálogo <span>({pagination.totalItems})</span>
          </h1>
        </div>

        <button
          type="button"
          className="catalog-filter-trigger"
          onClick={() => setFilterDrawerOpen(true)}
        >
          <SlidersHorizontal size={21} strokeWidth={1.8} aria-hidden="true" />
          Filtro
        </button>
      </section>

      <section className="catalog-shop-layout" aria-label="Productos del catálogo">
        <div className="catalog-product-area">
          {isLoading && <p className="catalog-status">Cargando catálogo...</p>}
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
                        <Heart
                          size={18}
                          strokeWidth={1.8}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>

                      <img
                        src={getCatalogProductImage(product)}
                        alt={product.nombre}
                        className="catalog-card-image"
                        onError={(event) => handleCatalogImageFallback(event, product.imagen)}
                      />
                    </div>

                    <div className="catalog-card-body">
                      <h3>{product.nombre}</h3>
                      {buildCatalogProductSummary(product) && (
                        <p className="catalog-card-meta">{buildCatalogProductSummary(product)}</p>
                      )}
                      <strong>{formatCatalogPrice(product.precio)}</strong>

                      <div className="catalog-card-action">
                        <span className="catalog-card-cta" aria-hidden="true">
                          Ver detalle
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="catalog-empty">
                  <h3>No hay productos con esos filtros</h3>
                  <p>Prueba otra categoría o limpia la búsqueda.</p>
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && pagination.totalItems > CATALOG_PAGE_SIZE && (
            <PaginationControls
              pagination={pagination}
              isLoading={isLoading}
              onPageChange={setCatalogPage}
            />
          )}
        </div>
      </section>

      {filterDrawerOpen && (
        <div
          className="catalog-filter-overlay"
          aria-hidden={!filterDrawerOpen}
          onClick={() => setFilterDrawerOpen(false)}
        >
          <aside
            className="catalog-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de catálogo"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="catalog-filter-drawer-header">
              <h2>Filtros</h2>
              <button
                type="button"
                className="catalog-filter-close"
                aria-label="Cerrar filtros"
                onClick={() => setFilterDrawerOpen(false)}
              >
                <X size={24} strokeWidth={1.7} />
              </button>
            </div>

            <form
              className="catalog-filter-content"
              onSubmit={(event) => {
                event.preventDefault();
                setFilterDrawerOpen(false);
              }}
            >
              <div className="catalog-filter-scroll">
                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Búsqueda</span>
                  </div>
                  <input
                    className="input catalog-shop-search"
                    placeholder="Buscar plantas, flores o macetas"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCatalogPage(1);
                    }}
                  />
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Categoría</span>
                  </div>
                  <div className="catalog-option-grid" role="radiogroup" aria-label="Categoría">
                    <button
                      type="button"
                      className={selectedCategoryId === "all" ? "active" : ""}
                      onClick={() => {
                        setSelectedCategoryId("all");
                        setCatalogPage(1);
                      }}
                    >
                      Todas
                    </button>

                    {normalizedCategories.map((category) => (
                      <button
                        type="button"
                        key={category.id}
                        className={selectedCategoryId === category.id ? "active" : ""}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setCatalogPage(1);
                        }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Tipo</span>
                  </div>
                  <div className="catalog-option-grid" role="radiogroup" aria-label="Tipo">
                    <button
                      type="button"
                      className={selectedTypeId === "all" ? "active" : ""}
                      onClick={() => {
                        setSelectedTypeId("all");
                        setCatalogPage(1);
                      }}
                    >
                      Todos
                    </button>

                    {normalizedProductTypes.map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        className={selectedTypeId === type.id ? "active" : ""}
                        onClick={() => {
                          setSelectedTypeId(type.id);
                          setCatalogPage(1);
                        }}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Tamaño</span>
                  </div>
                  <div className="catalog-option-grid" role="radiogroup" aria-label="Tamaño">
                    {CATALOG_FILTER_OPTIONS.SIZES.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={selectedSize === option.value ? "active" : ""}
                        onClick={() => {
                          setSelectedSize(option.value);
                          setCatalogPage(1);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Material</span>
                  </div>
                  <div className="catalog-option-grid" role="radiogroup" aria-label="Material">
                    {CATALOG_FILTER_OPTIONS.MATERIALS.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={selectedMaterial === option.value ? "active" : ""}
                        onClick={() => {
                          setSelectedMaterial(option.value);
                          setCatalogPage(1);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Disponibilidad</span>
                  </div>
                  <div
                    className="catalog-option-grid"
                    role="radiogroup"
                    aria-label="Disponibilidad"
                  >
                    {CATALOG_FILTER_OPTIONS.AVAILABILITY.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={selectedAvailability === option.value ? "active" : ""}
                        onClick={() => {
                          setSelectedAvailability(option.value);
                          setCatalogPage(1);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Precio</span>
                  </div>
                  <div className="catalog-price-filter">
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
                      {formatCatalogPrice(selectedMinPrice)} -{" "}
                      {formatCatalogPrice(selectedMaxPrice)}
                    </p>
                  </div>
                </section>

                <section className="catalog-filter-section">
                  <div className="catalog-filter-section-heading">
                    <span>Ordenar</span>
                  </div>
                  <div
                    className="catalog-sort-stack"
                    role="radiogroup"
                    aria-label="Ordenar productos"
                  >
                    {CATALOG_SORT_FILTER_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option.value || "none"}
                        className={selectedSortOrder === option.value ? "active" : ""}
                        onClick={() => {
                          setSelectedSortOrder(option.value);
                          setCatalogPage(1);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <div className="catalog-filter-actions">
                <button type="button" className="catalog-clear-button" onClick={clearFilters}>
                  Limpiar
                </button>
                <button type="submit" className="catalog-filter-apply">
                  Aplicar
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Catalog;
