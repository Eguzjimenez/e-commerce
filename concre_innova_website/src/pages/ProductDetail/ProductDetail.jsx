import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { getCatalogCategories, getCatalogProductById } from "../../services/catalogService";
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
import { PUBLIC_ROUTES } from "../../routes/routes";
import "./ProductDetail.css";

function ProductDetail() {
  const { idProducto } = useParams();
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(idProducto));
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProductDetail() {
      if (!idProducto) {
        setIsLoading(false);
        setError("Selecciona un producto desde el catalogo.");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [productResponse, categoriesResponse] = await Promise.all([
          getCatalogProductById(idProducto),
          getCatalogCategories(),
        ]);

        if (!isMounted) {
          return;
        }

        if (!productResponse) {
          setProduct(null);
          setError("No se encontro el producto solicitado.");
          return;
        }

        setProduct(productResponse);
        setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : []);
      } catch (loadError) {
        if (isMounted) {
          setProduct(null);
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

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    const cartProduct = buildCatalogModalProduct(product);
    addToCart(cartProduct, 1);

    await Swal.fire({
      icon: "success",
      title: "Agregado al carrito",
      text: `${cartProduct.nombre || cartProduct.name} fue agregado correctamente.`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

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

        <h2>{formatCatalogPrice(product.precio)}</h2>

        <button className="btn" type="button" onClick={handleAddToCart}>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;
