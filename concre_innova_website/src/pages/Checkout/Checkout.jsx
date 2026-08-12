import "./Checkout.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { clearCart, getCart } from "../../services/cartService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import { getUserId, isLoggedIn } from "../../services/authService";
import {
  isStockItemUnavailable,
  registerOrder,
  validateCartStock,
} from "../../services/orderService";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import ComprobantePedido from "../../components/ComprobantePedido/ComprobantePedido";

const CARD_PAYMENT_METHOD = "Tarjeta";
const PAYMENT_METHODS = [
  CARD_PAYMENT_METHOD,
  "SINPE Movil",
  "Efectivo contra entrega",
];

function buildOrderItems(cartItems) {
  return (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
    idProducto: Number(item.idProducto),
    idVariante: item.idVariante ? Number(item.idVariante) : null,
    nombreVariante: String(item.nombreVariante || "").trim(),
    tamano: String(item.tamano || "").trim(),
    material: String(item.material || "").trim(),
    color: String(item.color || "").trim(),
    cantidad: Math.max(1, Number(item.cantidad) || 1),
  }));
}

function formatCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validateCardData({ cardHolder, cardNumber, expiry, cvv }) {
  const cardHolderValue = String(cardHolder || "").trim();
  const cardDigits = String(cardNumber || "").replace(/\D/g, "");
  const expiryDigits = String(expiry || "").replace(/\D/g, "");
  const cvvDigits = String(cvv || "").replace(/\D/g, "");

  if (cardHolderValue.length < 5) {
    return "Ingresa el nombre completo del titular de la tarjeta.";
  }

  if (cardDigits.length !== 16) {
    return "El numero de tarjeta debe tener 16 digitos.";
  }

  if (expiryDigits.length !== 4) {
    return "La fecha de vencimiento debe tener formato MM/AA.";
  }

  const month = Number(expiryDigits.slice(0, 2));
  const year = Number(expiryDigits.slice(2));

  if (month < 1 || month > 12) {
    return "El mes de vencimiento es invalido.";
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  const isExpired = year < currentYear || (year === currentYear && month < currentMonth);

  if (isExpired) {
    return "La tarjeta esta vencida.";
  }

  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return "El CVV debe tener 3 o 4 digitos.";
  }

  return null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildReceiptHtml(receipt) {
  const rows = receipt.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.nombre)}</td>
          <td style="text-align:center;">${item.cantidad}</td>
          <td style="text-align:right;">${escapeHtml(formatCatalogPrice(item.precio))}</td>
          <td style="text-align:right;">${escapeHtml(formatCatalogPrice(item.subtotal))}</td>
        </tr>
      `
    )
    .join("");

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Comprobante de compra</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1d2a33; }
      h1 { margin: 0 0 8px; }
      .meta { margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { border-bottom: 1px solid #d8dde1; padding: 10px 8px; }
      th { background: #f4f6f8; text-align: left; }
      .total { margin-top: 16px; text-align: right; font-size: 1.1rem; font-weight: 700; }
      .foot { margin-top: 26px; color: #5b6770; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <h1>Comprobante de compra</h1>
    <p class="meta"><strong>Pedido:</strong> #${escapeHtml(receipt.idPedido)}</p>
    <p class="meta"><strong>Fecha:</strong> ${escapeHtml(receipt.fecha)}</p>
    <p class="meta"><strong>Cliente (usuario):</strong> ${escapeHtml(receipt.idUsuario)}</p>
    <p class="meta"><strong>Direccion:</strong> ${escapeHtml(receipt.direccionEntrega)}</p>
    <p class="meta"><strong>Metodo de pago:</strong> ${escapeHtml(receipt.metodoPago)}</p>
    ${receipt.last4 ? `<p class="meta"><strong>Tarjeta:</strong> Terminada en ${escapeHtml(receipt.last4)}</p>` : ""}

    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align:center;">Cantidad</th>
          <th style="text-align:right;">Precio unitario</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <p class="total">Total pagado: ${escapeHtml(formatCatalogPrice(receipt.total))}</p>
    <p class="foot">Este documento es un comprobante digital de tu compra.</p>
  </body>
</html>
  `;
}

function downloadReceipt(receipt) {
  const html = buildReceiptHtml(receipt);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const orderId = receipt?.idPedido ?? `temp-${Date.now()}`;

  anchor.href = url;
  anchor.download = `comprobante-pedido-${orderId}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mensajeExito, setMensajeExito] = useState("");
  const [productos, setProductos] = useState([]);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [metodoPago, setMetodoPago] = useState(CARD_PAYMENT_METHOD);
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [stockValidationResult, setStockValidationResult] = useState(null);
  const [isStockValidated, setIsStockValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderSubmissionInProgress = useRef(false);

  useEffect(() => {
    const syncCart = () => {
      setProductos(getCart());
      setIsStockValidated(false);
      setStockValidationResult(null);
      setMensajeExito("");
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  const total = useMemo(() => {
    return productos.reduce(
      (sum, item) => sum + Number(item.precio) * Number(item.cantidad),
      0
    );
  }, [productos]);
  const requiresCardData = metodoPago === CARD_PAYMENT_METHOD;

  const ensureUserSession = async () => {
    if (isLoggedIn()) {
      return true;
    }

    await Swal.fire({
      icon: "info",
      title: "Inicia sesion para continuar",
      text: "Debes iniciar sesion antes de validar stock o confirmar la compra.",
    });

    navigate(PUBLIC_ROUTES.LOGIN, {
      state: {
        from: { pathname: PRIVATE_ROUTES.CHECKOUT },
        cartRedirect: location.pathname,
      },
    });

    return false;
  };

  const handleValidateStock = async () => {
    setMensajeExito("");

    if (productos.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Carrito vacio",
        text: "No hay productos para validar.",
      });
      return;
    }

    if (!(await ensureUserSession())) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await validateCartStock(buildOrderItems(productos));
      const stockItems = Array.isArray(response?.items) ? response.items : [];
      const unavailableItems = stockItems.filter(isStockItemUnavailable);
      const todoDisponible = Boolean(response?.todoDisponible) && unavailableItems.length === 0;

      setStockValidationResult(response);

      if (!todoDisponible) {
        setIsStockValidated(false);

        const details = stockItems.length
          ? stockItems
              .map(
                (item) =>
                  `${item.nombre || `Producto ${item.idProducto}`}: solicitada ${item.cantidadSolicitada}, disponible ${item.stockDisponible}, estado ${item.estado || "sin estado"}`
              )
              .join("\n")
          : "No se pudo obtener el detalle del stock.";

        await Swal.fire({
          icon: "warning",
          title: "No hay stock suficiente",
          text: details,
        });
        return;
      }

      setIsStockValidated(true);
      await Swal.fire({
        icon: "success",
        title: "Stock validado",
        text: "Todos los productos tienen stock disponible. Ya puedes confirmar la compra.",
      });
    } catch (error) {
      setIsStockValidated(false);
      setStockValidationResult(null);
      await Swal.fire({
        icon: "error",
        title: "No se pudo validar stock",
        text: error?.message || "Ocurrio un error al validar el stock.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    setMensajeExito("");

    if (!(await ensureUserSession())) {
      return;
    }

    if (productos.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Carrito vacio",
        text: "No hay productos para comprar.",
      });
      return;
    }

    if (!isStockValidated) {
      await Swal.fire({
        icon: "warning",
        title: "Valida stock primero",
        text: "Antes de confirmar la compra debes validar el stock del carrito.",
      });
      return;
    }

    if (!direccionEntrega.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Direccion requerida",
        text: "Ingresa la direccion de entrega para continuar.",
      });
      return;
    }

    if (direccionEntrega.trim().length > 255) {
      await Swal.fire({
        icon: "warning",
        title: "Direccion demasiado larga",
        text: "La direccion de entrega no puede superar 255 caracteres.",
      });
      return;
    }

    const cardError = requiresCardData
      ? validateCardData({ cardHolder, cardNumber, expiry, cvv })
      : null;

    if (cardError) {
      await Swal.fire({
        icon: "warning",
        title: "Datos de tarjeta incompletos",
        text: cardError,
      });
      return;
    }

    const idUsuario = Number(getUserId());
    if (!idUsuario) {
      await Swal.fire({
        icon: "error",
        title: "Sesion invalida",
        text: "No fue posible identificar el usuario en sesion.",
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmar compra",
      text: "El pedido se registrara con los productos actuales del carrito.",
      showCancelButton: true,
      confirmButtonText: "Si, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    if (orderSubmissionInProgress.current) {
      return;
    }

    orderSubmissionInProgress.current = true;
    setIsSubmitting(true);

    try {
      const purchasedItems = productos.map((item) => ({
        nombre: item.nombre || `Producto ${item.idProducto}`,
        cantidad: Number(item.cantidad) || 0,
        precio: Number(item.precio) || 0,
        subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
      }));

      const cardDigits = String(cardNumber || "").replace(/\D/g, "");
      const last4 = requiresCardData ? cardDigits.slice(-4) : "";
      const response = await registerOrder({
        idUsuario,
        direccionEntrega: direccionEntrega.trim(),
        metodoPago,
        items: buildOrderItems(productos),
      });

      if (!response?.exitoso) {
        throw new Error(response?.mensaje || "No fue posible registrar el pedido.");
      }

      clearCart();
      setProductos([]);
      setIsStockValidated(false);
      setStockValidationResult(null);
      setCardHolder("");
      setCardNumber("");
      setExpiry("");
      setCvv("");

      const totalPedido = Number(response?.total);
      const totalText = formatCatalogPrice(Number.isFinite(totalPedido) ? totalPedido : total);
      const orderIdText = response?.idPedido != null ? ` (Pedido #${response.idPedido})` : "";
      const receiptData = {
        idPedido: response?.idPedido ?? "N/A",
        idUsuario,
        fecha: new Date().toLocaleString("es-CR"),
        direccionEntrega: direccionEntrega.trim(),
        metodoPago,
        last4,
        total: Number.isFinite(totalPedido) ? totalPedido : total,
        items: purchasedItems,
      };

      setReceipt(receiptData);

      setMensajeExito(
        `Compra realizada correctamente${orderIdText}. Total registrado: ${totalText}.`
      );

      await Swal.fire({
        icon: "success",
        title: "Pedido registrado",
        text: response?.mensaje || "Tu pedido fue formalizado correctamente.",
      });
    } catch (error) {
      console.error("Error al registrar pedido", {
        status: error?.status,
        message: error?.message,
        details: error?.details,
      });

      await Swal.fire({
        icon: "error",
        title: "No se pudo confirmar la compra",
        text: error?.message || "Ocurrio un error al registrar el pedido.",
      });
    } finally {
      orderSubmissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page container">
      <div className="checkout-card">
        <div className="checkout-heading checkout-heading-wide">
          <span className="checkout-eyebrow">Pago seguro</span>
          <h1>Pago</h1>
          <p>Completa la informacion para finalizar tu compra.</p>
        </div>

        <div className="checkout-layout">
          <aside className="checkout-panel checkout-summary-panel">
            <div className="checkout-panel-head">
              <h3>Resumen de compra</h3>
              <p>{productos.length} productos en carrito</p>
            </div>

            <div className="checkout-summary-list">
              {productos.length === 0 ? (
                <p className="checkout-empty">No hay productos en el carrito.</p>
              ) : (
                productos.map((producto) => (
                  <div className="checkout-summary-item" key={producto.idProducto}>
                    <div>
                      <strong>{producto.nombre}</strong>
                      <span>x{producto.cantidad}</span>
                    </div>

                    <strong>
                      {formatCatalogPrice(
                        Number(producto.precio) * Number(producto.cantidad)
                      )}
                    </strong>
                  </div>
                ))
              )}
            </div>

            <div className="checkout-total-box">
              <span>Total</span>
              <strong>{formatCatalogPrice(total)}</strong>
            </div>
          </aside>

          <section className="checkout-panel checkout-form-panel">
            <div className="checkout-panel-head">
              <h3>Datos de pago</h3>
              <p>Selecciona el metodo de pago y confirma la compra.</p>
            </div>

            <input
              className="input"
              placeholder="Direccion de entrega"
              value={direccionEntrega}
              maxLength={255}
              onChange={(event) => setDireccionEntrega(event.target.value)}
            />

            <fieldset className="checkout-payment-method">
              <legend>Metodo de pago</legend>
              <div className="checkout-payment-options">
                {PAYMENT_METHODS.map((paymentMethod) => (
                  <label className="checkout-payment-option" key={paymentMethod}>
                    <input
                      type="radio"
                      name="metodoPago"
                      value={paymentMethod}
                      checked={metodoPago === paymentMethod}
                      onChange={(event) => setMetodoPago(event.target.value)}
                    />
                    <span>{paymentMethod}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {requiresCardData && (
              <>
                <input
                  className="input"
                  placeholder="Nombre del titular"
                  value={cardHolder}
                  onChange={(event) => setCardHolder(event.target.value)}
                />

                <input
                  className="input"
                  inputMode="numeric"
                  placeholder="Numero de tarjeta"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                />

                <div className="checkout-card-row">
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  />

                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="CVV"
                    value={cvv}
                    onChange={(event) =>
                      setCvv(
                        String(event.target.value || "")
                          .replace(/\D/g, "")
                          .slice(0, 4)
                      )
                    }
                  />
                </div>
              </>
            )}

            <div className="checkout-actions">
              <input
                type="hidden"
                value={metodoPago}
                readOnly
              />
              <button className="btn" onClick={handleValidateStock} disabled={isSubmitting}>
                Validar stock
              </button>

              <button
                className="btn"
                onClick={handleConfirmOrder}
                disabled={isSubmitting || !isStockValidated}
                aria-disabled={isSubmitting || !isStockValidated}
              >
                Confirmar compra
              </button>
            </div>

            {stockValidationResult && (
              <p className="checkout-feedback checkout-feedback-stock">
                {isStockValidated
                  ? "Stock verificado correctamente."
                  : "Hay productos sin stock suficiente. Revisa el detalle en la notificacion."}
              </p>
            )}

            {mensajeExito && (
              <p className="checkout-feedback checkout-feedback-success">
                {mensajeExito}
              </p>
            )}

            {receipt && (
              <div className="checkout-receipt-actions">
                <ComprobantePedido pedido={receipt} />
                <button
                  className="btn checkout-receipt-btn"
                  type="button"
                  onClick={() => downloadReceipt(receipt)}
                >
                  Descargar comprobante HTML
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
