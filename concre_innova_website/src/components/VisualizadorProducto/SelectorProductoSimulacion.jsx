import { useEffect, useState } from "react";
import { getCatalogProducts } from "../../services/catalogService";
import {
  formatCatalogPrice,
  getCatalogProductAttributeText,
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";

const RESULTADOS_POR_BUSQUEDA = 8;

function obtenerProductos(respuesta) {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  return Array.isArray(respuesta?.items) ? respuesta.items : [];
}

/**
 * Permite elegir un producto del catalogo o de las recomendaciones para
 * agregarlo a la simulacion del espacio.
 */
function SelectorProductoSimulacion({
  productosRecomendados = [],
  onAgregarProducto,
  deshabilitado = false,
}) {
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const buscarProductos = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await getCatalogProducts({
          searchTerm: busquedaAplicada,
          page: 1,
          pageSize: RESULTADOS_POR_BUSQUEDA,
          availability: "disponible",
          signal: controller.signal,
        });

        setResultados(obtenerProductos(respuesta));
      } catch (requestError) {
        if (requestError?.name !== "AbortError") {
          setError(requestError?.message || "No fue posible cargar el catalogo.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    };

    buscarProductos();
    return () => controller.abort();
  }, [busquedaAplicada]);

  const handleBuscar = (event) => {
    event.preventDefault();
    setBusquedaAplicada(terminoBusqueda.trim());
  };

  const mostrarRecomendados =
    !busquedaAplicada && productosRecomendados.length > 0;
  const productosMostrados = mostrarRecomendados
    ? productosRecomendados
    : resultados;

  return (
    <section className="simulacion-selector">
      <form className="simulacion-selector-busqueda" onSubmit={handleBuscar}>
        <input
          type="search"
          aria-label="Buscar productos para la simulación"
          placeholder="Buscar planta o macetero"
          value={terminoBusqueda}
          onChange={(event) => setTerminoBusqueda(event.target.value)}
        />
        <button type="submit" disabled={cargando}>
          Buscar
        </button>
      </form>

      <p className="simulacion-selector-titulo">
        {mostrarRecomendados ? "Recomendados para ti" : "Catalogo"}
      </p>

      {cargando && <p className="simulacion-estado">Cargando productos...</p>}
      {!cargando && error && <p className="simulación-estado error">{error}</p>}

      {!cargando && !error && productosMostrados.length === 0 && (
        <p className="simulacion-estado">
          No se encontraron productos para esa búsqueda.
        </p>
      )}

      <div className="simulacion-selector-lista">
        {productosMostrados.map((producto) => (
          <article className="simulacion-selector-card" key={producto.idProducto}>
            <img
              src={getCatalogProductImage(producto)}
              alt={producto.nombre}
              onError={(event) => handleCatalogImageFallback(event, producto.imagen)}
            />

            <div className="simulacion-selector-datos">
              <strong>{producto.nombre}</strong>
              <span>{getCatalogProductAttributeText(producto, "tamano")}</span>
              <span className="simulacion-selector-precio">
                {formatCatalogPrice(producto.precio)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onAgregarProducto(producto)}
              disabled={deshabilitado}
              title={
                deshabilitado
                  ? "Sube primero la foto de tu espacio"
                  : `Agregar ${producto.nombre} a la simulación`
              }
            >
              Agregar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SelectorProductoSimulacion;
