import "./Checkout.css";
import { useEffect, useMemo, useState } from "react";
import { clearCart, getCart } from "../../services/cartService";

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
    // Limpia el carrito
    clearCart();

    // Limpia el resumen
    setProductos([]);

    // Muestra el mensaje solicitado
    setMensajeExito(
      "✅ Compra realizada correctamente. El procedimiento ha concluido de forma adecuada dentro de la plataforma."
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

        {/* NUEVO - Resumen de productos */}

        <h3>Resumen de compra</h3>

        {productos.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <>
            {productos.map((producto) => (
              <div
                key={producto.idProducto}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>
                  {producto.nombre} x{producto.cantidad}
                </span>

                <span>
                  $
                  {(Number(producto.precio) * Number(producto.cantidad)).toFixed(
                    2
                  )}
                </span>
              </div>
            ))}

            <hr />

            <h3>Total: ${total.toFixed(2)}</h3>
          </>
        )}

        {/* FIN NUEVO */}

        <input className="input" placeholder="Nombre" />
        <input className="input" placeholder="Tarjeta" />
        <input className="input" placeholder="Direccion" />

        <button className="btn" onClick={finalizarCompra}>
          Finalizar compra
        </button>

        {mensajeExito && (
          <p
            style={{
              color: "green",
              marginTop: "15px",
              fontWeight: "bold",
            }}
          >
            {mensajeExito}
          </p>
        )}
      </div>
    </div>
  );
}


export default Checkout;