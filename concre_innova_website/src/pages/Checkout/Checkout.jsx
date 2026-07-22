import "./Checkout.css";
import { useEffect, useMemo, useState } from "react";
import { clearCart, getCart } from "../../services/cartService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";

function Checkout() {
  const [mensajeExito, setMensajeExito] = useState("");
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    setProductos(getCart());
  }, []);

  const total = useMemo(() => {
    return productos.reduce(
      (sum, item) => sum + Number(item.precio) * Number(item.cantidad),
      0
    );
  }, [productos]);

  const finalizarCompra = () => {
    clearCart();
    setProductos([]);
    setMensajeExito(
      "Compra realizada correctamente. El procedimiento ha concluido de forma adecuada dentro de la plataforma."
    );
  };

  return (
    <div className="checkout-page container">
      <div className="checkout-card">
        <div className="checkout-heading">
          <span className="checkout-eyebrow">Pago seguro</span>
          <h1>Pago</h1>
          <p>Completa la informacion para finalizar tu compra.</p>
        </div>

        <section className="checkout-summary" aria-label="Resumen de compra">
          <h3>Resumen de compra</h3>

          {productos.length === 0 ? (
            <p>No hay productos en el carrito.</p>
          ) : (
            <>
              <div className="checkout-summary-list">
                {productos.map((producto) => (
                  <div className="checkout-summary-item" key={producto.idProducto}>
                    <span>
                      {producto.nombre} x{producto.cantidad}
                    </span>
                    <span>
                      {formatCatalogPrice(
                        Number(producto.precio) * Number(producto.cantidad)
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-summary-total">
                <span>Total</span>
                <strong>{formatCatalogPrice(total)}</strong>
              </div>
            </>
          )}
        </section>

        <div className="checkout-form-fields">
          <input className="input" placeholder="Nombre" />
          <input className="input" placeholder="Tarjeta" />
          <input className="input" placeholder="Direccion" />
        </div>

        <button className="btn" onClick={finalizarCompra}>
          Finalizar compra
        </button>

        {mensajeExito && <p className="checkout-success">{mensajeExito}</p>}
      </div>
    </div>
  );
}

export default Checkout;
