import { useState } from "react";
import IMAGEN from "../../img/Maceta-Negra.jpg";
import ProductModal from "../../components/ProductModal/ProductModal";

function Catalog() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("catalog");

  return (
    <div className="container">
      <h1>Catálogo</h1>

      <input className="input" placeholder="Buscar productos..." />

      <div className="grid">
        {[1,2,3,4,5,6,7,8].map((item) => (
          <div 
            className="card" 
            key={item}
            onClick={() => {
              setSelectedProduct({
                name: `Producto ${item}`,
                price: 25,
                img: IMAGEN,
                images: [IMAGEN, IMAGEN, IMAGEN],
                description: "Planta decorativa ideal para interiores 🌿"
              });
              setMode("catalog");
            }}
          >
            <img src={IMAGEN} alt={`Producto ${item}`} />
            <h3>Producto {item}</h3>
            <p>$25</p>
            <button 
              className="btn"
              onClick={(e) => e.stopPropagation()} // 
            >
              Agregar
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 MODAL */}
      <ProductModal
        product={selectedProduct}
        mode={mode}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Catalog;