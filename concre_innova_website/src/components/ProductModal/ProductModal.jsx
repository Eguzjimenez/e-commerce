import "./ProductModal.css";
import { useState } from "react";

function ProductModal({ product, mode, onClose, onAddToCart, onRemoveFromCart }) {
  const [currentImg, setCurrentImg] = useState(0);

  if (!product) return null;

  const isCart = mode === "cart";
  const images = product.images || [product.img];
  const productName = product.nombre || product.name || "Producto";

  const stock = Number(product.stock);
  const hasNumericStock = !Number.isNaN(stock);
  const availabilityText = product.availability || "Sin disponibilidad";
  const normalizedAvailabilityText = String(availabilityText).trim().toLowerCase();

  let availabilityClass = "availability-out";

  if (normalizedAvailabilityText.includes("agotad")) {
    availabilityClass = "availability-out";
  } else if (normalizedAvailabilityText.includes("disponible")) {
    availabilityClass = "availability-in";
  } else if (hasNumericStock || /^\d+/.test(normalizedAvailabilityText)) {
    availabilityClass = "availability-low";
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ios" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          x
        </button>

        <div className="modal-image-wrap">
          <img
            src={images[currentImg]}
            alt={productName}
            className="main-img"
          />
        </div>

        <div className="img-gallery">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${productName} vista ${index + 1}`}
              className={currentImg === index ? "active" : ""}
              onClick={() => setCurrentImg(index)}
            />
          ))}
        </div>

        <span className="product-category">Interior | Decoracion</span>
        <h2>{product.name}</h2>
        <p>{product.description || "Maseta color negro"}</p>
        <p className={`product-availability ${availabilityClass}`}>{availabilityText}</p>

        <h3>${product.price}</h3>

        {isCart ? (
          <button className="btn btn-danger" onClick={() => onRemoveFromCart?.(product)}>
            Eliminar del carrito
          </button>
        ) : (
          <button className="btn" onClick={() => onAddToCart?.(product)}>
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductModal;
