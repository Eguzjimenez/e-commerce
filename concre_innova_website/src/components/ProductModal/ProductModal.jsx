import "./ProductModal.css";
import { useState } from "react";

function ProductModal({ product, mode, onClose, onAddToCart, onRemoveFromCart }) {
  const [currentImg, setCurrentImg] = useState(0);

  if (!product) return null;

  const isCart = mode === "cart";

  const images = product.images || [product.img];

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

        <span className="modal-close" onClick={onClose}>×</span>

        <img 
          src={images[currentImg]} 
          alt="producto" 
          className="main-img"
        />

        <div className="img-gallery">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              className={currentImg === index ? "active" : ""}
              onClick={() => setCurrentImg(index)}
            />
          ))}
        </div>

        <h2>{product.name}</h2>
        <p>{product.description || "Maseta color negro"}</p>
        <p className={`product-availability ${availabilityClass}`}>{availabilityText}</p>

        <h3>${product.price}</h3>

        {/* 🛒 ACCIONES */}
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