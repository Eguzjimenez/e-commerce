import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import IMAGEN from "../../img/Maceta-Negra.jpg";
import "./Cart.css";
import ProductModal from "../../components/ProductModal/ProductModal";
import { getProductImageCandidates } from "../../services/catalogService";
import { isLoggedIn } from "../../services/authService";
import { getCart, removeFromCart } from "../../services/cartService";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";

function Cart() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncCart = () => {
      const cartProducts = getCart().map((item) => {
        const imageCandidates = getProductImageCandidates(item.imagen);

        return {
          id: item.idProducto,
          idProducto: item.idProducto,
          name: item.nombre,
          price: Number(item.precio) || 0,
          img: imageCandidates[0] || IMAGEN,
          images: imageCandidates.length ? [...imageCandidates, IMAGEN] : [IMAGEN],
          description: item.descripcion,
          quantity: Number(item.cantidad) || 1,
          imagen: item.imagen,
        };
      });

      setProducts(cartProducts);
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  const total = useMemo(
    () => products.reduce((sum, product) => sum + product.price * product.quantity, 0),
    [products]
  );

  const handleRemoveFromCart = async (product) => {
    removeFromCart(product.idProducto || product.id);
    setSelectedProduct(null);

    await Swal.fire({
      icon: "success",
      title: "Producto eliminado",
      text: `${product.name} fue eliminado del carrito.`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleProceedToCheckout = async () => {
    if (products.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Carrito vacio",
        text: "Agrega productos antes de continuar al pago.",
      });
      return;
    }

    if (!isLoggedIn()) {
      navigate(PUBLIC_ROUTES.LOGIN, {
        state: {
          from: { pathname: PRIVATE_ROUTES.CHECKOUT },
          cartRedirect: location.pathname,
        },
      });
      return;
    }

    navigate(PRIVATE_ROUTES.CHECKOUT);
  };

  return (
    <div className="cart-page container">
      <div className="cart-heading">
        <div>
          <span className="cart-eyebrow">Compra</span>
          <h1>Carrito</h1>
          <p>Revisa los productos seleccionados antes de continuar con el pago.</p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {products.map((product) => (
            <button
              type="button"
              key={product.id}
              className="cart-item"
              onClick={() => setSelectedProduct(product)}
            >
              <img src={product.img} alt={product.name} />

              <div className="cart-info">
                <span className="product-category">Producto seleccionado</span>
                <h3>{product.name}</h3>
                <p>${product.price}</p>
              </div>

              <span className="cart-qty">x{product.quantity}</span>
            </button>
          ))}

          {products.length === 0 && (
            <div className="cart-empty">Tu carrito esta vacio.</div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Resumen</h2>
          <p className="summary-copy">Productos en carrito: {products.length}</p>

          <div className="summary-total">
            <span>Total</span>
            <span>${total}</span>
          </div>

          <button className="btn checkout-btn" onClick={handleProceedToCheckout}>
            Ir a pagar
          </button>
        </aside>
      </div>

      <ProductModal
        product={selectedProduct}
        mode="cart"
        onClose={() => setSelectedProduct(null)}
        onRemoveFromCart={handleRemoveFromCart}
      />
    </div>
  );
}

export default Cart;
