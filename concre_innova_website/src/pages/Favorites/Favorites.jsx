import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { addToCart } from "../../services/cartService";
import {
  getFavorites,
  removeFavorite,
} from "../../services/favoriteService";
import {
  formatCatalogPrice,
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";
import { buildProductDetailRoute, PUBLIC_ROUTES } from "../../routes/routes";
import "./Favorites.css";

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFavorites() {
      setIsLoading(true);
      setError("");

      try {
        const currentFavorites = await getFavorites();

        if (isMounted) {
          setFavorites(currentFavorites);
        }
      } catch (loadError) {
        if (isMounted) {
          setFavorites([]);
          setError(loadError.message || "No se pudieron actualizar los favoritos.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFavorites();

    const handleFavoritesChange = async (event) => {
      const changedProductId = Number(event.detail?.idProducto);

      if (changedProductId && event.detail?.isFavorite === false) {
        setFavorites((currentFavorites) =>
          currentFavorites.filter(
            (favorite) => Number(favorite.idProducto) !== changedProductId
          )
        );
        return;
      }

      setFavorites(await getFavorites());
    };

    window.addEventListener("favoriteschange", handleFavoritesChange);

    return () => {
      isMounted = false;
      window.removeEventListener("favoriteschange", handleFavoritesChange);
    };
  }, []);

  const handleAddToCart = async (product) => {
    addToCart(product, 1);

    await Swal.fire({
      icon: "success",
      title: "Agregado al carrito",
      text: `${product.nombre} fue agregado correctamente.`,
      timer: 1300,
      showConfirmButton: false,
    });
  };

  const handleRemoveFavorite = async (product) => {
    await removeFavorite(product.idProducto);
    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (favorite) => Number(favorite.idProducto) !== Number(product.idProducto)
      )
    );

    await Swal.fire({
      icon: "success",
      title: "Favorito eliminado",
      text: `${product.nombre} fue eliminado correctamente.`,
      timer: 1300,
      showConfirmButton: false,
    });
  };

  return (
    <div className="favorites-page container">
      <section className="favorites-heading">
        <div>
          <span className="favorites-eyebrow">Lista de deseos</span>
          <h1>Mis Favoritos</h1>
          <p>Revisa y gestiona los productos guardados para futuras compras.</p>
        </div>

        <Link to={PUBLIC_ROUTES.CATALOG} className="favorites-catalog-link">
          Ver catalogo
        </Link>
      </section>

      {isLoading && <p className="favorites-status">Cargando favoritos...</p>}
      {!isLoading && error && <p className="favorites-warning">{error}</p>}

      {!isLoading && favorites.length > 0 && (
        <section className="favorites-grid" aria-label="Productos favoritos">
          {favorites.map((product) => (
            <article className="favorite-card" key={product.idProducto}>
              <Link
                to={buildProductDetailRoute(product.idProducto)}
                className="favorite-image-link"
                aria-label={`Ver detalle de ${product.nombre}`}
              >
                <img
                  src={getCatalogProductImage(product)}
                  alt={product.nombre}
                  onError={(event) => handleCatalogImageFallback(event, product.imagen)}
                />
              </Link>

              <div className="favorite-card-body">
                <div>
                  <span className="product-category">Producto guardado</span>
                  <h2>{product.nombre}</h2>
                  <p>{product.descripcion || "Producto guardado en favoritos."}</p>
                </div>

                <strong>{formatCatalogPrice(product.precio)}</strong>

                <div className="favorite-actions">
                  <button type="button" onClick={() => handleAddToCart(product)}>
                    Agregar al carrito
                  </button>
                  <button
                    type="button"
                    className="favorite-remove-button"
                    onClick={() => handleRemoveFavorite(product)}
                    aria-label={`Eliminar ${product.nombre} de favoritos`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {!isLoading && favorites.length === 0 && (
        <section className="favorites-empty">
          <h2>No tienes favoritos guardados</h2>
          <p>Explora el catalogo y guarda productos para revisarlos despues.</p>
          <Link to={PUBLIC_ROUTES.CATALOG} className="btn">
            Ir al catalogo
          </Link>
        </section>
      )}
    </div>
  );
}

export default Favorites;
