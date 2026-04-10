import IMAGEN from "../../img/Maceta-Negra.jpg";

function ProductDetail() {
  return (
    <div className="container" style={{display:"flex", gap:"40px"}}>
      <img src={IMAGEN} alt="Maceta Negra" />

      <div>
        <h1>Planta decorativa</h1>
        <p>Perfecta para interiores, mejora el ambiente y la estética.</p>

        <h2>$40</h2>

        <button className="btn">Agregar al carrito</button>
      </div>
    </div>
  );
}

export default ProductDetail;