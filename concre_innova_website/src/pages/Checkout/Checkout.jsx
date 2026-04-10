function Checkout() {
  return (
    <div className="container">
      <h1>Pago</h1>

      <input className="input" placeholder="Nombre" />
      <input className="input" placeholder="Tarjeta" />
      <input className="input" placeholder="Dirección" />

      <button className="btn">Finalizar compra</button>
    </div>
  );
}

export default Checkout;