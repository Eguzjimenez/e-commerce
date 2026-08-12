import {
  formatCatalogPrice,
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";

const CANTIDAD_MAXIMA = 100;

/**
 * Productos ya colocados sobre el espacio, con la configuracion que se guarda
 * en la visualizacion y que viaja al carrito: cantidad, color y macetero.
 */
function ListaProductosSimulacion({
  items,
  maceteros,
  itemSeleccionadoId,
  onSeleccionarItem,
  onActualizarItem,
  onEliminarItem,
}) {
  if (items.length === 0) {
    return (
      <p className="simulacion-estado">
        Agrega productos del catalogo para verlos en tu espacio.
      </p>
    );
  }

  return (
    <ul className="simulacion-items">
      {items.map((item) => (
        <li
          key={item.idItem}
          className={`simulacion-item ${
            itemSeleccionadoId === item.idItem ? "activo" : ""
          }`}
        >
          <button
            type="button"
            className="simulacion-item-cabecera"
            onClick={() => onSeleccionarItem(item.idItem)}
          >
            <img
              src={getCatalogProductImage(item.producto)}
              alt={item.producto.nombre}
              onError={(event) =>
                handleCatalogImageFallback(event, item.producto.imagen)
              }
            />

            <span>
              <strong>{item.producto.nombre}</strong>
              <small>{formatCatalogPrice(item.producto.precio)}</small>
            </span>
          </button>

          <div className="simulacion-item-campos">
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                max={CANTIDAD_MAXIMA}
                step="1"
                value={item.cantidad}
                onChange={(event) =>
                  onActualizarItem(item.idItem, {
                    cantidad: Math.min(
                      CANTIDAD_MAXIMA,
                      Math.max(1, Number(event.target.value) || 1)
                    ),
                  })
                }
              />
            </label>

            <label>
              Color
              <input
                type="text"
                maxLength={80}
                placeholder="Ej. Blanco"
                value={item.color}
                onChange={(event) =>
                  onActualizarItem(item.idItem, { color: event.target.value })
                }
              />
            </label>

            <label>
              Macetero
              <select
                value={item.macetero}
                onChange={(event) =>
                  onActualizarItem(item.idItem, { macetero: event.target.value })
                }
              >
                <option value="">Sin macetero</option>
                {maceteros.map((macetero) => (
                  <option key={macetero.idProducto} value={macetero.nombre}>
                    {macetero.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            className="simulacion-item-eliminar"
            onClick={() => onEliminarItem(item.idItem)}
            aria-label={`Quitar ${item.producto.nombre} de la simulacion`}
          >
            Quitar
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ListaProductosSimulacion;
