function ProductDetail() {
  return (
    <div className="container" style={{display:"flex", gap:"40px"}}>
      <img src="https://via.placeholder.com/300" />

      <div>
        <h1>Planta decorativa</h1>
        <p>Perfecta para interiores, mejora el ambiente y la estética.</p>

        <h2>$25</h2>

        <button className="btn">Agregar al carrito</button>
      </div>
    </div>
  );
}