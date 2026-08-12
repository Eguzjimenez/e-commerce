import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import VisualizadorProducto from "../../components/VisualizadorProducto/VisualizadorProducto";
import {
  getCatalogCategories,
  getCatalogProductById,
  getCatalogProductVariants,
  getRelatedCatalogProducts,
} from "../../services/catalogService";
import { addToCart } from "../../services/cartService";
import {
  buildCatalogModalProduct,
  formatCatalogPrice,
  getCatalogProductAttributeText,
  getCatalogProductAvailabilityClass,
  getCatalogProductAvailabilityText,
  getCatalogProductCategoryName,
  getCatalogProductImage,
  handleCatalogImageFallback,
  normalizeCatalogCategories,
} from "../../services/catalogPresentationService";
import { buildProductDetailRoute, PUBLIC_ROUTES } from "../../routes/routes";
import "./ProductDetail.css";

function ProductDetail() {
  const { idProducto } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(idProducto));
  const [error, setError] = useState("");
  const [showVisualizer, setShowVisualizer] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProductDetail() {
      if (!idProducto) {
        setIsLoading(false);
        setProduct(null);
        setRelatedProducts([]);
        setVariants([]);
        setError("Selecciona un producto desde el catalogo.");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const relatedProductsRequest = getRelatedCatalogProducts(idProducto).catch(() => []);
        const variantsRequest = getCatalogProductVariants(idProducto).catch(() => []);
        const [
          productResponse,
          categoriesResponse,
          relatedProductsResponse,
          variantsResponse
        ] = await Promise.all([
          getCatalogProductById(idProducto),
          getCatalogCategories(),
          relatedProductsRequest,
          variantsRequest,
        ]);

        if (!isMounted) {
          return;
        }

        if (!productResponse) {
          setProduct(null);
          setRelatedProducts([]);
          setVariants([]);
          setError("No se encontro el producto solicitado.");
          return;
        }

        setProduct(productResponse);
        setRelatedProducts(Array.isArray(relatedProductsResponse) ? relatedProductsResponse : []);
        const normalizedVariants = Array.isArray(variantsResponse) ? variantsResponse : [];
        const defaultVariant = normalizedVariants.find((variant) => variant.estaDisponible) || normalizedVariants[0];
        setVariants(normalizedVariants);
        setSelectedVariantId(defaultVariant ? String(defaultVariant.idVariante) : "");
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      } catch (loadError) {
        if (isMounted) {
          setProduct(null);
          setRelatedProducts([]);
          setVariants([]);
          setError(loadError.message || "No se pudo cargar el detalle del producto.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProductDetail();

    return () => {
      isMounted = false;
    };
  }, [idProducto]);

  const normalizedCategories = useMemo(
    () => normalizeCatalogCategories(categories),
    [categories]
  );

  const selectedVariant = useMemo(() => {
    return variants.find(
      (variant) => String(variant.idVariante) === String(selectedVariantId)
    ) || null;
  }, [selectedVariantId, variants]);

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    if (selectedVariant && !selectedVariant.estaDisponible) {
      await Swal.fire({
        icon: "warning",
        title: "Variante no disponible",
        text: "Selecciona una variante disponible para agregarla al carrito.",
      });
      return;
    }

    const cartProduct = buildCatalogModalProduct(product);
    const selectedCartProduct = selectedVariant
      ? {
          ...cartProduct,
          idVariante: selectedVariant.idVariante,
          nombreVariante: selectedVariant.nombreVariante,
          nombre: `${cartProduct.nombre} - ${selectedVariant.nombreVariante}`,
          precio: Number(selectedVariant.precio) || cartProduct.precio,
          price: Number(selectedVariant.precio) || cartProduct.price,
          imagen: selectedVariant.imagen || cartProduct.imagen,
          imageName: selectedVariant.imagen || cartProduct.imageName,
          tamano: selectedVariant.tamano || cartProduct.tamano,
          material: selectedVariant.material || cartProduct.material,
          stock: selectedVariant.stock,
        }
      : cartProduct;
    addToCart(selectedCartProduct, 1);

    await Swal.fire({
      icon: "success",
      title: "Agregado al carrito",
      text: `${selectedCartProduct.nombre || selectedCartProduct.name} fue agregado correctamente.`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const visualizerProduct = useMemo(() => {
    if (!product) {
      return null;
    }

    const variantName = selectedVariant?.nombreVariante
      ? `${product.nombre} - ${selectedVariant.nombreVariante}`
      : product.nombre;
    const variantImage = selectedVariant?.imagen || product.imagen;
    const variantPrice = Number(selectedVariant?.precio) || Number(product.precio) || 0;

    return {
      ...product,
      imagen: variantImage,
      Imagen: getCatalogProductImage({ ...product, imagen: variantImage }),
      Nombre: variantName,
      Precio: variantPrice,
    };
  }, [product, selectedVariant]);

  if (isLoading) {
    return (
      <div className="product-detail-page container">
        <p className="product-detail-status">Cargando detalle del producto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page container product-detail-empty">
        <h1>Producto no disponible</h1>
        <p>{error || "No se pudo mostrar el producto solicitado."}</p>
        <Link to={PUBLIC_ROUTES.CATALOG} className="btn">
          Ver catalogo
        </Link>
      </div>
    );
  }

  const availabilityClass = getCatalogProductAvailabilityClass(product);

  return (
    <>
      <div className="product-detail-page container">
        <div className="product-detail-media product-visual">
          <span className={`product-rating ${availabilityClass}`}>
            {getCatalogProductAvailabilityText(product)}
          </span>
          <img
            src={getCatalogProductImage(product)}
            alt={product.nombre}
            onError={(event) => handleCatalogImageFallback(event, product.imagen)}
          />
        </div>

        <div className="product-detail-info">
          <Link to={PUBLIC_ROUTES.CATALOG} className="product-detail-back">
            Volver al catalogo
          </Link>
          <span className="product-category">
            {getCatalogProductCategoryName(product, normalizedCategories)}
          </span>
          <h1>{product.nombre}</h1>
          <p>{product.descripcion || "Producto para interiores y exteriores."}</p>

          <dl className="product-detail-specs">
            <div>
              <dt>Disponibilidad</dt>
              <dd>{getCatalogProductAvailabilityText(product)}</dd>
            </div>
            <div>
              <dt>Categoria</dt>
              <dd>{getCatalogProductCategoryName(product, normalizedCategories)}</dd>
            </div>
            <div>
              <dt>Tamano</dt>
              <dd>{getCatalogProductAttributeText(product, "tamano")}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{getCatalogProductAttributeText(product, "material")}</dd>
            </div>
            <div>
              <dt>Referencia</dt>
              <dd>#{product.idProducto}</dd>
            </div>
          </dl>

          {variants.length > 0 && (
            <label className="product-detail-variant">
              Variante
              <select
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
              >
                {variants.map((variant) => (
                  <option
                    key={variant.idVariante}
                    value={variant.idVariante}
                    disabled={!variant.estaDisponible}
                  >
                    {variant.nombreVariante} - {formatCatalogPrice(variant.precio)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <h2>{formatCatalogPrice(selectedVariant?.precio ?? product.precio)}</h2>

          <div className="product-detail-actions">
            <button className="btn" type="button" onClick={handleAddToCart}>
              Agregar al carrito
            </button>

            <button
              className="btn secondary product-visualizer-button"
              type="button"
              onClick={() => setShowVisualizer(true)}
            >
              Visualizar en mi espacio
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="product-related-section container">
          <div className="product-related-header">
            <h2>Productos relacionados</h2>
            <Link to={PUBLIC_ROUTES.CATALOG}>Ver catalogo</Link>
          </div>

          <div className="product-related-grid">
            {relatedProducts.map((relatedProduct) => (
              <Link
                className="product-related-card"
                key={relatedProduct.idProducto}
                to={buildProductDetailRoute(relatedProduct.idProducto)}
              >
                <img
                  src={getCatalogProductImage(relatedProduct)}
                  alt={relatedProduct.nombre}
                  onError={(event) => handleCatalogImageFallback(event, relatedProduct.imagen)}
                />
                <div>
                  <span>{getCatalogProductCategoryName(relatedProduct, normalizedCategories)}</span>
                  <h3>{relatedProduct.nombre}</h3>
                  <p>
                    {getCatalogProductAttributeText(relatedProduct, "tamano")} -{" "}
                    {getCatalogProductAttributeText(relatedProduct, "material")}
                  </p>
                  <strong>{formatCatalogPrice(relatedProduct.precio)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showVisualizer && visualizerProduct && (
        <VisualizadorProducto
          producto={visualizerProduct}
          onClose={() => setShowVisualizer(false)}
        />
      )}
    </>
  );
}

export default ProductDetail;
