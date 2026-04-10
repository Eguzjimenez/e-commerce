import { useState } from "react";
import IMAGEN from "../../img/Maceta-Negra.jpg";
import "./Cart.css";
import ProductModal from "../../components/ProductModal/ProductModal";

function Cart() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState("cart"); 

  const products = [
    {
      id: 1,
      name: "Planta 1",
      price: 25,
      img: IMAGEN,
      images: [IMAGEN, IMAGEN, IMAGEN],
      description: "Planta decorativa ideal para interiores 🌿",
      quantity: 1
    },
    {
      id: 2,
      name: "Planta 2", 
      price: 30,
      img: IMAGEN,
      images: [IMAGEN, IMAGEN, IMAGEN],
      description: "Planta tropical con hojas grandes 🌴",
      quantity: 2
    },
    {
      id: 3,
      name: "Planta 3",
      price: 20,
      img: IMAGEN,
      images: [IMAGEN, IMAGEN, IMAGEN],
      description: "Suculenta perfecta para principiantes 🌵",
      quantity: 1
    },
    {
      id: 4,
      name: "Planta 4",
      price: 35,
      img: IMAGEN,
      images: [IMAGEN, IMAGEN, IMAGEN],
      description: "Planta de interior con flores coloridas 🌸",
      quantity: 3
    }
  ];

  return (
    <div className="cart-page container">
      <h1>Carrito</h1>

      <div className="cart-list">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="cart-item"
            onClick={() => {
              setSelectedProduct({
                name: product.name,
                price: product.price,
                img: product.img,
                images: product.images,
                description: product.description
              });
              setMode("cart");
            }}
          >
            <img src={product.img} alt={product.name} />

            <div className="cart-info">
              <h3>{product.name}</h3>
              <p>${product.price}</p>
            </div>

            <span className="cart-qty">x{product.quantity}</span>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="cart-summary">

        <div className="summary-total">
          <span>Total</span>
          <span>${products.reduce((total, product) => total + (product.price * product.quantity), 0)}</span>
        </div>

        <button className="btn checkout-btn">
          Ir a pagar
        </button>
      </div>
      

      {/* 🔥 MODAL COMPONENTE */}
      <ProductModal
        product={selectedProduct}
        mode={mode}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

export default Cart;