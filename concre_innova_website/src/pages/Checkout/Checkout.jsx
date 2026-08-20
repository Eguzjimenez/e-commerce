import "./Checkout.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AlertTriangle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { clearCart, getCart } from "../../services/cartService";
import { formatCatalogPrice } from "../../services/catalogPresentationService";
import { getUserId, isLoggedIn } from "../../services/authService";
import { getMyInfo, updateUserInfo } from "../../services/userService";
import {
  isStockItemUnavailable,
  registerOrder,
  validateCartStock,
} from "../../services/orderService";
import {
  registrarComprobantePago,
  validarComprobante,
  validarReferencia,
} from "../../services/pagoService";
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from "../../routes/routes";
import {
  desglosarImpuesto,
  formatearPorcentajeImpuesto,
} from "../../services/pricingService";
import ComprobantePedido from "../../components/ComprobantePedido/ComprobantePedido";
import { descargarDocumento } from "../../services/documentService";

const CARD_PAYMENT_METHOD = "Tarjeta";
const SINPE_PAYMENT_METHOD = "SINPE Movil";
const CASH_PAYMENT_METHOD = "Efectivo contra entrega";

/**
 * El sistema no captura datos de tarjeta: registra la referencia que devuelve el
 * medio de pago. SINPE Movil ademas exige el comprobante de la transferencia.
 */
const PAYMENT_METHODS = [
  {
    id: CARD_PAYMENT_METHOD,
    label: "Tarjeta",
    requiereReferencia: true,
    requiereComprobante: false,
  },
  {
    id: SINPE_PAYMENT_METHOD,
    label: "SINPE Móvil",
    requiereReferencia: true,
    requiereComprobante: true,
  },
  {
    id: CASH_PAYMENT_METHOD,
    label: "Efectivo contra entrega",
    requiereReferencia: false,
    requiereComprobante: false,
  },
];

const MAX_DIRECCION = 255;
const MIN_DIRECCION = 10;

const ESTADO_STOCK = {
  PENDIENTE: "pendiente",
  VALIDANDO: "validando",
  DISPONIBLE: "disponible",
  INSUFICIENTE: "insuficiente",
  ERROR: "error",
};

function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((method) => method.id === id) || PAYMENT_METHODS[0];
}

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

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mensajeExito, setMensajeExito] = useState("");
  const [productos, setProductos] = useState([]);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [direccionGuardada, setDireccionGuardada] = useState("");
  const [guardarDireccion, setGuardarDireccion] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [metodoPago, setMetodoPago] = useState(CARD_PAYMENT_METHOD);
  const [referenciaPago, setReferenciaPago] = useState("");
  const [comprobante, setComprobante] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [estadoStock, setEstadoStock] = useState(ESTADO_STOCK.PENDIENTE);
  const [itemsSinStock, setItemsSinStock] = useState([]);
  const [errorStock, setErrorStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderSubmissionInProgress = useRef(false);

  const metodoSeleccionado = getPaymentMethod(metodoPago);

  useEffect(() => {
    const syncCart = () => {
      setProductos(getCart());
      setMensajeExito("");
    };

    syncCart();
    window.addEventListener("cartchange", syncCart);

    return () => window.removeEventListener("cartchange", syncCart);
  }, []);

  // La direccion de entrega sale de la ficha del cliente: no se vuelve a pedir
  // en cada compra, solo se confirma o se ajusta.
  useEffect(() => {
    if (!isLoggedIn()) {
      return undefined;
    }

    let vigente = true;

    getMyInfo()
      .then((info) => {
        if (!vigente) {
          return;
        }

        setPerfil(info);
        const direccion = String(info?.direccion || "").trim();

        if (direccion) {
          setDireccionGuardada(direccion);
          setDireccionEntrega((actual) => actual || direccion);
        }
      })
      .catch(() => {
        // Si el perfil no carga, el cliente todavia puede escribir la direccion.
      });

    return () => {
      vigente = false;
    };
  }, []);

  const total = useMemo(() => {
    return productos.reduce(
      (sum, item) => sum + Number(item.precio) * Number(item.cantidad),
      0
    );
  }, [productos]);

  // El impuesto no se suma: se desglosa el que ya viene incluido en el precio,
  // para que el total cobrado coincida exactamente con el que registra la API.
  const desglose = useMemo(() => desglosarImpuesto(total), [total]);

  /**
   * Consulta el stock en la API. El sistema lo hace por su cuenta: el cliente
   * nunca tiene que pedirlo, solo ve el resultado.
   */
  const revisarStock = useCallback(async (items) => {
    if (items.length === 0) {
      setEstadoStock(ESTADO_STOCK.PENDIENTE);
      setItemsSinStock([]);
      setErrorStock("");
      return false;
    }

    setEstadoStock(ESTADO_STOCK.VALIDANDO);
    setErrorStock("");

    try {
      const response = await validateCartStock(buildOrderItems(items));
      const stockItems = Array.isArray(response?.items) ? response.items : [];
      const faltantes = stockItems.filter(isStockItemUnavailable);
      const todoDisponible = Boolean(response?.todoDisponible) && faltantes.length === 0;

      setItemsSinStock(faltantes);
      setEstadoStock(todoDisponible ? ESTADO_STOCK.DISPONIBLE : ESTADO_STOCK.INSUFICIENTE);

      return todoDisponible;
    } catch (error) {
      setItemsSinStock([]);
      setEstadoStock(ESTADO_STOCK.ERROR);
      setErrorStock(error?.message || "No fue posible confirmar la disponibilidad.");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn() || productos.length === 0) {
      setEstadoStock(ESTADO_STOCK.PENDIENTE);
      setItemsSinStock([]);
      return;
    }

    revisarStock(productos);
  }, [productos, revisarStock]);

  const ensureUserSession = async () => {
    if (isLoggedIn()) {
      return true;
    }

    await Swal.fire({
      icon: "info",
      title: "Inicia sesión para continuar",
      text: "Debes iniciar sesión antes de confirmar la compra.",
    });

    navigate(PUBLIC_ROUTES.LOGIN, {
      state: {
        from: { pathname: PRIVATE_ROUTES.CHECKOUT },
        cartRedirect: location.pathname,
      },
    });

    return false;
  };

  const handleComprobanteChange = (event) => {
    const archivo = event.target.files?.[0] || null;
    setComprobante(archivo);
  };

  const validarDatosDePago = () => {
    if (metodoSeleccionado.requiereReferencia) {
      const errorReferencia = validarReferencia(referenciaPago);
      if (errorReferencia) {
        return errorReferencia;
      }
    }

    if (metodoSeleccionado.requiereComprobante) {
      const errorComprobante = validarComprobante(comprobante);
      if (errorComprobante) {
        return errorComprobante;
      }
    }

    return "";
  };

  /** Guarda la direccion en la ficha del cliente cuando este lo pide. */
  const persistirDireccion = async (direccion) => {
    if (!guardarDireccion || !perfil?.idUsuario || direccion === direccionGuardada) {
      return;
    }

    try {
      await updateUserInfo({
        idUsuario: perfil.idUsuario,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        correo: perfil.correo,
        telefono: perfil.telefono,
        direccion,
      });

      setDireccionGuardada(direccion);
    } catch {
      // Guardar la direccion es una comodidad: no debe frenar el pedido.
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
        title: "Carrito vacío",
        text: "No hay productos para comprar.",
      });
      return;
    }

    const direccion = direccionEntrega.trim();

    if (direccion.length < MIN_DIRECCION) {
      await Swal.fire({
        icon: "warning",
        title: "Dirección incompleta",
        text: "Indica provincia, cantón y señas para poder entregar el pedido.",
      });
      return;
    }

    if (direccion.length > MAX_DIRECCION) {
      await Swal.fire({
        icon: "warning",
        title: "Dirección demasiado larga",
        text: `La dirección de entrega no puede superar ${MAX_DIRECCION} caracteres.`,
      });
      return;
    }

    const errorPago = validarDatosDePago();

    if (errorPago) {
      await Swal.fire({
        icon: "warning",
        title: "Revisa los datos del pago",
        text: errorPago,
      });
      return;
    }

    const idUsuario = Number(getUserId());
    if (!idUsuario) {
      await Swal.fire({
        icon: "error",
        title: "Sesión inválida",
        text: "No fue posible identificar el usuario en sesión.",
      });
      return;
    }

    const confirmation = await Swal.fire({
      icon: "question",
      title: "Confirmar compra",
      text: "El pedido se registrará con los productos actuales del carrito.",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
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
      // Revalidacion inmediata: entre cargar la pantalla y confirmar, otro
      // cliente pudo haberse llevado las ultimas unidades.
      const disponible = await revisarStock(productos);

      if (!disponible) {
        await Swal.fire({
          icon: "warning",
          title: "Sin stock suficiente",
          text: "La disponibilidad cambió. Revisa el detalle del resumen antes de continuar.",
        });
        return;
      }

      const purchasedItems = productos.map((item) => ({
        nombre: item.nombre || `Producto ${item.idProducto}`,
        cantidad: Number(item.cantidad) || 0,
        precio: Number(item.precio) || 0,
        subtotal: (Number(item.cantidad) || 0) * (Number(item.precio) || 0),
      }));

      const response = await registerOrder({
        idUsuario,
        direccionEntrega: direccion,
        metodoPago,
        items: buildOrderItems(productos),
      });

      if (!response?.exitoso) {
        throw new Error(response?.mensaje || "No fue posible registrar el pedido.");
      }

      const referencia = referenciaPago.trim();
      let avisoPago = "";

      if (metodoSeleccionado.requiereReferencia && response?.idPedido) {
        try {
          const resultadoPago = await registrarComprobantePago({
            idPedido: response.idPedido,
            referencia,
            comprobante: metodoSeleccionado.requiereComprobante ? comprobante : null,
          });

          if (Number(resultadoPago?.codigo) !== 1) {
            avisoPago =
              resultadoPago?.mensaje ||
              "El pedido quedó registrado, pero el comprobante no pudo guardarse.";
          }
        } catch (pagoError) {
          avisoPago =
            pagoError?.message ||
            "El pedido quedó registrado, pero el comprobante no pudo guardarse.";
        }
      }

      await persistirDireccion(direccion);

      clearCart();
      setProductos([]);
      setEstadoStock(ESTADO_STOCK.PENDIENTE);
      setItemsSinStock([]);
      setReferenciaPago("");
      setComprobante(null);

      const totalPedido = Number(response?.total);
      const finalTotal = Number.isFinite(totalPedido) ? totalPedido : total;
      const totalText = formatCatalogPrice(finalTotal);
      const orderIdText = response?.idPedido != null ? ` (Pedido #${response.idPedido})` : "";

      setReceipt({
        idPedido: response?.idPedido ?? "N/A",
        idUsuario,
        fecha: new Date().toLocaleString("es-CR"),
        direccionEntrega: direccion,
        metodoPago,
        referencia,
        total: finalTotal,
        items: purchasedItems,
      });

      setMensajeExito(
        `Compra realizada correctamente${orderIdText}. Total registrado: ${totalText}.`
      );

      await Swal.fire({
        icon: avisoPago ? "warning" : "success",
        title: "Pedido registrado",
        text:
          avisoPago ||
          response?.mensaje ||
          "Tu pedido fue formalizado correctamente.",
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo confirmar la compra",
        text: error?.message || "Ocurrió un error al registrar el pedido.",
      });
    } finally {
      orderSubmissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  const stockBloqueado =
    estadoStock === ESTADO_STOCK.VALIDANDO ||
    estadoStock === ESTADO_STOCK.INSUFICIENTE ||
    estadoStock === ESTADO_STOCK.ERROR;

  const direccionDistinta =
    Boolean(direccionGuardada) && direccionEntrega.trim() !== direccionGuardada;

  return (
    <div className="checkout-page container">
      <div className="checkout-card">
        <div className="checkout-heading checkout-heading-wide">
          <span className="checkout-eyebrow">Pago seguro</span>
          <h1>Finalizar compra</h1>
          <p>Confirma la dirección de entrega y el método de pago de tu pedido.</p>
        </div>

        <div className="checkout-layout">
          <aside className="checkout-panel checkout-summary-panel">
            <div className="checkout-panel-head">
              <h2>Resumen de compra</h2>
              <p>
                {productos.length}{" "}
                {productos.length === 1 ? "producto en el carrito" : "productos en el carrito"}
              </p>
            </div>

            <div className="checkout-summary-list">
              {productos.length === 0 ? (
                <p className="checkout-empty">No hay productos en el carrito.</p>
              ) : (
                productos.map((producto) => (
                  <div
                    className="checkout-summary-item"
                    key={`${producto.idProducto}-${producto.idVariante || 0}`}
                  >
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

            {productos.length > 0 && (
              <div className={`checkout-stock-status is-${estadoStock}`} role="status">
                {estadoStock === ESTADO_STOCK.VALIDANDO && (
                  <>
                    <Loader2 size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Verificando disponibilidad...</span>
                  </>
                )}

                {estadoStock === ESTADO_STOCK.DISPONIBLE && (
                  <>
                    <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Disponibilidad confirmada para todos los productos.</span>
                  </>
                )}

                {estadoStock === ESTADO_STOCK.INSUFICIENTE && (
                  <div>
                    <p className="checkout-stock-title">
                      <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
                      No hay stock suficiente
                    </p>
                    <ul>
                      {itemsSinStock.map((item) => (
                        <li key={`${item.idProducto}-${item.idVariante || 0}`}>
                          {item.nombre || `Producto ${item.idProducto}`}: solicitas{" "}
                          {item.cantidadSolicitada}, quedan {item.stockDisponible}.
                        </li>
                      ))}
                    </ul>
                    <p>Ajusta las cantidades en el carrito para continuar.</p>
                  </div>
                )}

                {estadoStock === ESTADO_STOCK.ERROR && (
                  <>
                    <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
                    <span>{errorStock}</span>
                  </>
                )}
              </div>
            )}

            <div className="checkout-total-box">
              <div className="checkout-total-row">
                <span>Subtotal</span>
                <span>{formatCatalogPrice(desglose.subtotal)}</span>
              </div>

              <div className="checkout-total-row">
                <span>
                  IVA ({formatearPorcentajeImpuesto(desglose.tasa)})
                  <small>Incluido en el precio</small>
                </span>
                <span>{formatCatalogPrice(desglose.impuesto)}</span>
              </div>

              <div className="checkout-total-row checkout-total-row--final">
                <span>Total a pagar</span>
                <strong>{formatCatalogPrice(desglose.total)}</strong>
              </div>
            </div>
          </aside>

          <section className="checkout-panel checkout-form-panel">
            <div className="checkout-panel-head">
              <h2>Entrega y pago</h2>
              <p>Revisa tus datos y elige cómo quieres pagar.</p>
            </div>

            <div className="checkout-field">
              <label className="checkout-label" htmlFor="checkout-direccion">
                <MapPin size={15} strokeWidth={1.9} aria-hidden="true" />
                Dirección de entrega
              </label>
              <textarea
                className="checkout-input"
                id="checkout-direccion"
                rows={3}
                value={direccionEntrega}
                maxLength={MAX_DIRECCION}
                autoComplete="street-address"
                placeholder="Provincia, cantón, distrito y señas exactas"
                onChange={(event) => setDireccionEntrega(event.target.value)}
              />
              <p className="checkout-help">
                {direccionGuardada
                  ? "Tomada de tu perfil. Puedes ajustarla solo para este pedido."
                  : "Todavía no tienes una dirección guardada en tu perfil."}
              </p>

              {(direccionDistinta || !direccionGuardada) && (
                <label className="checkout-checkbox">
                  <input
                    type="checkbox"
                    checked={guardarDireccion}
                    onChange={(event) => setGuardarDireccion(event.target.checked)}
                  />
                  <span>Guardar esta dirección en mi perfil</span>
                </label>
              )}
            </div>

            <fieldset className="checkout-payment-method">
              <legend>Método de pago</legend>
              <div className="checkout-payment-options">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    className={`checkout-payment-option ${
                      metodoPago === method.id ? "is-selected" : ""
                    }`.trim()}
                    key={method.id}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value={method.id}
                      checked={metodoPago === method.id}
                      onChange={(event) => setMetodoPago(event.target.value)}
                    />
                    <span className="checkout-payment-option-title">{method.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {metodoSeleccionado.requiereReferencia && (
              <div className="checkout-field">
                <label className="checkout-label" htmlFor="checkout-referencia">
                  Número de referencia del pago
                </label>
                <input
                  className="checkout-input"
                  id="checkout-referencia"
                  value={referenciaPago}
                  maxLength={100}
                  placeholder="Ej.: 987654321"
                  onChange={(event) => setReferenciaPago(event.target.value)}
                />
                <p className="checkout-help">
                  No pedimos el número de tarjeta ni el CVV: solo el comprobante que
                  emite tu banco.
                </p>
              </div>
            )}

            {metodoSeleccionado.requiereComprobante && (
              <div className="checkout-field">
                <label className="checkout-label" htmlFor="checkout-comprobante">
                  Comprobante de la transferencia
                </label>
                <input
                  className="checkout-input checkout-file"
                  id="checkout-comprobante"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleComprobanteChange}
                />
                <p className="checkout-help">
                  {comprobante
                    ? `Archivo seleccionado: ${comprobante.name}`
                    : "Adjunta una imagen JPG, PNG o WEBP de hasta 5 MB."}
                </p>
              </div>
            )}

            <div className="checkout-actions">
              <button
                className="btn"
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting || productos.length === 0 || stockBloqueado}
                aria-disabled={isSubmitting || productos.length === 0 || stockBloqueado}
              >
                {isSubmitting ? "Procesando..." : "Confirmar compra"}
              </button>
            </div>

            {mensajeExito && (
              <p className="checkout-feedback checkout-feedback-success">{mensajeExito}</p>
            )}

            {receipt && (
              <div className="checkout-receipt-actions">
                <ComprobantePedido pedido={receipt} />
                <button
                  className="btn checkout-receipt-btn"
                  type="button"
                  onClick={() => descargarDocumento("pedido", receipt)}
                >
                  Descargar comprobante
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
