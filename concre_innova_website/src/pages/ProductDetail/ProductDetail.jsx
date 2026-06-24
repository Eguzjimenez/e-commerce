import IMAGEN from "../../img/Maceta-Negra.jpg";
import "./ProductDetail.css";

function ProductDetail() {
  return (
    <div className="product-detail-page container">
      <div className="product-detail-media product-visual">
        <span className="product-rating">4.8</span>
        <img src={IMAGEN} alt="Maceta Negra" />
      </div>

      <div className="product-detail-info">
        <span className="product-category">Interior | Decoracion</span>
        <h1>Planta decorativa</h1>
        <p>Perfecta para interiores, mejora el ambiente y la estetica.</p>

        <h2>$40</h2>

        <button className="btn">Agregar al carrito</button>
      </div>
    </div>
  );
}

export default ProductDetail;
