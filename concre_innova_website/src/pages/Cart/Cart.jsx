import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import IMAGEN from "../../img/Maceta-Negra.jpg";
import ProductModal from "../../components/ProductModal/ProductModal";
import { getProductImageCandidates } from "../../services/catalogService";
import { isLoggedIn } from "../../services/authService";
import {
  calculateCartSubtotal,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../../services/cartService";
import {
  isStockItemUnavailable,
  validateCartStock,
} from "../../services/orderService";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import "./Cart.css";

function getCartItemKey(product) {
  return `${product.idProducto}:${product.idVariante || 0}`;
}

function getProductAttributes(product) {
  return [
    product.nombreVariante,
    product.nombreTipo,
    product.tamano,
    product.material,
    product.color,
    product.macetero ? `Macetero: ${product.macetero}` : "",
  ].filter((value) => String(value || "").trim());
}

function Cart() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [updatingItemKey, setUpdatingItemKey] = useState("");
  const [stockSummary, setStockSummary] = useState({
    status: "idle",
    response: null,
    message: "",
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncCart = () => {
      const cartProducts = getCart().map((item) => {
        const imageCandidates =
          getProductImageCandidates(item.imagen) || [];

        return {
          id: item.idProducto,
          idProducto: item.idProducto,
          idVariante: item.idVariante || null,
          name: item.nombre,
          nombre: item.nombre,
          price: Number(item.precio) || 0,
          precio: Number(item.precio) || 0,
          img: imageCandidates[0] || IMAGEN,
          images: imageCandidates.length
            ? [...imageCandidates, IMAGEN]
            : [IMAGEN],
          description: item.descripcion,
          descripcion: item.descripcion,
          quantity: Number(item.cantidad) || 1,
          cantidad: Number(item.cantidad) || 1,
          imagen: item.imagen,
          nombreVariante: item.nombreVariante || "",
          tamano: item.tamano || "",
          material: item.material || "",
          color: item.color || "",
          nombreTipo: item.nombreTipo || "",
          macetero: item.macetero || "",
        };
      });

      setProducts(cartProducts);
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  const calculatedSubtotal = useMemo(
    () => calculateCartSubtotal(products),
    [products]
  );

  useEffect(() => {
    if (products.length === 0) {
      setStockSummary({
        status: "idle",
        response: null,
        message: "",
      });
      return undefined;
    }

    const controller = new AbortController();
    const validationTimer = window.setTimeout(async () => {
      setStockSummary({
        status: "loading",
        response: null,
        message: "Validando disponibilidad y precios...",
      });

      try {
        const response = await validateCartStock(products, {
          signal: controller.signal,
        });
        const stockItems = Array.isArray(response?.items)
          ? response.items
          : [];
        const unavailableItems = stockItems.filter(isStockItemUnavailable);
        const allAvailable =
          Boolean(response?.todoDisponible) &&
          unavailableItems.length === 0;

        setStockSummary({
          status: allAvailable ? "available" : "unavailable",
          response,
          message: allAvailable
            ? "Todos los productos tienen stock disponible."
            : "Hay productos sin stock suficiente.",
        });
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setStockSummary({
          status: "error",
          response: null,
          message:
            error?.message ||
            "No fue posible validar la disponibilidad del carrito.",
        });
      }
    }, 150);

    return () => {
      window.clearTimeout(validationTimer);
      controller.abort();
    };
  }, [products]);

  const validatedItemsByKey = useMemo(() => {
    const items = Array.isArray(stockSummary.response?.items)
      ? stockSummary.response.items
      : [];

    return new Map(
      items.map((item) => [
        `${Number(item.idProducto)}:${Number(item.idVariante) || 0}`,
        item,
      ])
    );
  }, [stockSummary.response]);

  const validatedSubtotal = Number(stockSummary.response?.subtotal);
  const purchaseSubtotal =
    stockSummary.status === "available" && Number.isFinite(validatedSubtotal)
      ? validatedSubtotal
      : calculatedSubtotal;

  const totalUnits = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + (Number(product.quantity) || 0),
        0
      ),
    [products]
  );

  const handleRemoveFromCart = async (product) => {
    const confirmation = await Swal.fire({
      icon: "question",
      title: "Eliminar producto",
      text: `Se eliminara ${product.name} del carrito.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#a62121",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    removeFromCart(product.idProducto, product.idVariante);
    setSelectedProduct(null);

    await Swal.fire({
      icon: "success",
      title: "Producto eliminado",
      text: `${product.name} fue eliminado del carrito.`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleQuantityChange = async (product, requestedQuantity) => {
    const parsedQuantity = Number(requestedQuantity);

    if (!Number.isFinite(parsedQuantity) || !Number.isInteger(parsedQuantity)) {
      await Swal.fire({
        icon: "warning",
        title: "Cantidad invalida",
        text: "La cantidad debe ser un numero entero.",
      });
      return;
    }

    const nextQuantity = Math.max(1, parsedQuantity);

    if (nextQuantity === product.quantity) {
      return;
    }

    if (nextQuantity < product.quantity) {
      updateCartItemQuantity(
        product.idProducto,
        product.idVariante,
        nextQuantity
      );
      return;
    }

    const itemKey = getCartItemKey(product);
    setUpdatingItemKey(itemKey);

    try {
      const stockResponse = await validateCartStock([
        {
          ...product,
          cantidad: nextQuantity,
        },
      ]);
      const stockItems = Array.isArray(stockResponse?.items)
        ? stockResponse.items
        : [];
      const unavailableItem = stockItems.find(isStockItemUnavailable);

      if (!stockResponse?.todoDisponible || unavailableItem) {
        const availableStock = Number(unavailableItem?.stockDisponible);
        const availabilityMessage = Number.isFinite(availableStock)
          ? `Solo hay ${availableStock} unidad(es) disponibles.`
          : "No hay stock suficiente para la cantidad solicitada.";

        await Swal.fire({
          icon: "warning",
          title: "Cantidad no disponible",
          text: availabilityMessage,
        });
        return;
      }

      updateCartItemQuantity(
        product.idProducto,
        product.idVariante,
        nextQuantity
      );
    } catch (requestError) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo validar el stock",
        text:
          requestError?.message ||
          "Intenta modificar la cantidad nuevamente.",
      });
    } finally {
      setUpdatingItemKey("");
    }
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

    if (stockSummary.status !== "available") {
      await Swal.fire({
        icon: "warning",
        title: "Stock pendiente de validacion",
        text:
          stockSummary.message ||
          "Espera a que se valide la disponibilidad de todos los productos.",
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
          {products.map((product) => {
            const itemKey = getCartItemKey(product);
            const isUpdating = updatingItemKey === itemKey;
            const attributes = getProductAttributes(product);
            const validatedItem = validatedItemsByKey.get(itemKey);
            const validatedItemSubtotal = Number(validatedItem?.subtotal);
            const subtotal = Number.isFinite(validatedItemSubtotal)
              ? validatedItemSubtotal
              : product.price * product.quantity;
            const validatedUnitPrice = Number(validatedItem?.precioUnitario);
            const unitPrice = Number.isFinite(validatedUnitPrice)
              ? validatedUnitPrice
              : product.price;

            return (
              <article className="cart-item" key={itemKey}>
                <button
                  type="button"
                  className="cart-product-preview"
                  onClick={() => setSelectedProduct(product)}
                >
                  <img src={product.img} alt={product.name} />

                  <div className="cart-info">
                    <span className="product-category">
                      Producto seleccionado
                    </span>
                    <h3>{product.name}</h3>
                    {attributes.length > 0 && (
                      <p className="cart-attributes">
                        {attributes.join(" | ")}
                      </p>
                    )}
                    <p>Precio unitario: {formatCatalogPrice(unitPrice)}</p>
                  </div>
                </button>

                <div className="cart-purchase-controls">
                  <strong className="cart-subtotal">
                    {formatCatalogPrice(subtotal)}
                  </strong>

                  <div className="cart-quantity-control">
                    <button
                      type="button"
                      title="Disminuir cantidad"
                      aria-label={`Disminuir cantidad de ${product.name}`}
                      onClick={() =>
                        handleQuantityChange(product, product.quantity - 1)
                      }
                      disabled={product.quantity <= 1 || isUpdating}
                    >
                      <Minus size={17} aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      aria-label={`Cantidad de ${product.name}`}
                      value={product.quantity}
                      onChange={(event) =>
                        handleQuantityChange(product, event.target.value)
                      }
                      disabled={isUpdating}
                    />
                    <button
                      type="button"
                      title="Aumentar cantidad"
                      aria-label={`Aumentar cantidad de ${product.name}`}
                      onClick={() =>
                        handleQuantityChange(product, product.quantity + 1)
                      }
                      disabled={isUpdating}
                    >
                      <Plus size={17} aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-remove-button"
                    title="Eliminar del carrito"
                    aria-label={`Eliminar ${product.name} del carrito`}
                    onClick={() => handleRemoveFromCart(product)}
                    disabled={isUpdating}
                  >
                    <Trash2 size={19} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}

          {products.length === 0 && (
            <div className="cart-empty">Tu carrito esta vacio.</div>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Resumen</h2>
          <p className="summary-copy">Productos distintos: {products.length}</p>
          <p className="summary-copy">Unidades: {totalUnits}</p>

          <div className="summary-total">
            <span>Subtotal</span>
            <span>{formatCatalogPrice(purchaseSubtotal)}</span>
          </div>

          <p
            className={`cart-stock-status ${stockSummary.status}`}
            role="status"
            aria-live="polite"
          >
            {products.length > 0
              ? stockSummary.message || "Preparando validacion de stock..."
              : "Agrega productos para calcular el subtotal."}
          </p>

          <button
            className="btn checkout-btn"
            onClick={handleProceedToCheckout}
            disabled={
              products.length === 0 ||
              stockSummary.status !== "available"
            }
          >
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
