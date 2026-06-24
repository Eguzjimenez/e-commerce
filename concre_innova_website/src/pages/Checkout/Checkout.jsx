import "./Checkout.css";

function Checkout() {
  return (
    <div className="checkout-page container">
      <div className="checkout-card">
        <div className="checkout-heading">
          <span className="checkout-eyebrow">Pago seguro</span>
          <h1>Pago</h1>
          <p>Completa la informacion para finalizar tu compra.</p>
        </div>

        <input className="input" placeholder="Nombre" />
        <input className="input" placeholder="Tarjeta" />
        <input className="input" placeholder="Direccion" />

        <button className="btn">Finalizar compra</button>
      </div>
    </div>
  );
}

export default Checkout;
