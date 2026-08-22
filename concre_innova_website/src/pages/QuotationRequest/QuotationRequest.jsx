import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ImagePlus,
  Leaf,
  MapPin,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Truck,
  Trash2,
} from "lucide-react";
import Swal from "sweetalert2";
import { getCatalogProducts } from "../../services/catalogService";
import { createQuotation } from "../../services/quotationService";
import { getCompanyInfo } from "../../services/empresaService";
import {
  getCatalogProductImage,
  handleCatalogImageFallback,
} from "../../services/catalogPresentationService";
import "./QuotationRequest.css";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUESTED_PRODUCTS = 50;
const MAX_NOTE_LENGTH = 160;
const MAX_FINISH_LENGTH = 40;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const QUOTATION_STEPS = [
  { titulo: "Productos", detalle: "Revisa tus productos" },
  { titulo: "Datos del proyecto", detalle: "Cuéntanos los detalles" },
  { titulo: "Enviar solicitud", detalle: "Recibe tu cotización" },
];

const DELIVERY_OPTIONS = [
  "Entrega a domicilio",
  "Retiro en la tienda",
  "Coordinar con el equipo",
];

const PROVINCE_OPTIONS = [
  "Alajuela",
  "Cartago",
  "Guanacaste",
  "Heredia",
  "Limón",
  "Puntarenas",
  "San José",
];

const TRUST_ITEMS = [
  {
    Icono: ShieldCheck,
    titulo: "Materiales de alta calidad",
    detalle: "Concreto arquitectónico de larga duración.",
  },
  {
    Icono: Leaf,
    titulo: "Diseños funcionales y estéticos",
    detalle: "Macetas que elevan y transforman tus espacios.",
  },
  {
    Icono: Truck,
    titulo: "Entregas seguras",
    detalle: "Empaque especializado para que llegue en perfectas condiciones.",
  },
  {
    Icono: BadgeCheck,
    titulo: "Asesoría personalizada",
    detalle: "Te acompañamos en cada paso de tu proyecto.",
  },
];

/** Tonos conocidos del catálogo; cualquier otro texto usa la muestra neutra. */
const FINISH_SWATCHES = [
  [/antracit|grafit|negro/i, "#2f3336"],
  [/arena|beige|crema/i, "#d8c9a3"],
  [/terracot|ladrillo|rojiz/i, "#a5624a"],
  [/blanco|marfil/i, "#f2efe9"],
  [/verde|oliva/i, "#4f6b4f"],
  [/gris|concreto|natural/i, "#9a9a95"],
];

let productRowSequence = 0;

function formatFileSize(size) {
  return `${(Number(size) / (1024 * 1024)).toFixed(2)} MB`;
}

function getFinishSwatch(texto) {
  const valor = String(texto || "").trim();
  const encontrado = FINISH_SWATCHES.find(([patron]) => patron.test(valor));
  return encontrado ? encontrado[1] : "var(--surface-muted)";
}

function getResponseItems(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response?.items) ? response.items : [];
}

function normalizeProduct(product) {
  return {
    idProducto: Number(product.idProducto ?? product.id),
    nombre: product.nombre ?? product.name ?? "Producto",
    descripcion: product.descripcion ?? "",
    imagen: product.imagen ?? "",
    material: product.material ?? "",
    tamano: product.tamano ?? "",
  };
}

function createProductRow(idProducto = "", material = "") {
  productRowSequence += 1;
  return {
    key: productRowSequence,
    idProducto,
    cantidad: 1,
    acabado: material,
    nota: "",
    notaAbierta: false,
  };
}

function buildProductCode(idProducto) {
  const numero = Number(idProducto);
  return Number.isFinite(numero) && numero > 0
    ? `MC-${String(numero).padStart(3, "0")}`
    : "—";
}

function validateSelectedImages(files) {
  if (files.length === 0) {
    return "Selecciona al menos una imagen.";
  }

  if (files.length > MAX_IMAGES) {
    return `Solo puedes adjuntar hasta ${MAX_IMAGES} imágenes.`;
  }

  const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type));
  if (invalidType) {
    return `${invalidType.name} debe ser una imagen JPG, PNG o WebP.`;
  }

  const oversizedFile = files.find((file) => file.size > MAX_IMAGE_BYTES);
  if (oversizedFile) {
    return `${oversizedFile.name} supera el limite de 5 MB.`;
  }

  return null;
}

function validateRequestedProducts(rows) {
  if (rows.length === 0) {
    return "Selecciona al menos un producto.";
  }

  const normalizedRows = rows.map((row) => ({
    idProducto: Number(row.idProducto),
    cantidad: Number(row.cantidad),
  }));

  if (
    normalizedRows.some(
      (row) =>
        !Number.isInteger(row.idProducto) ||
        row.idProducto <= 0 ||
        !Number.isInteger(row.cantidad) ||
        row.cantidad <= 0 ||
        row.cantidad > 1000
    )
  ) {
    return "Selecciona productos válidos y cantidades entre 1 y 1000.";
  }

  if (
    new Set(normalizedRows.map((row) => row.idProducto)).size !==
    normalizedRows.length
  ) {
    return "Un producto no puede aparecer mas de una vez.";
  }

  return null;
}

/**
 * La API solo recibe `descripcion`, `preferencias`, productos e imágenes. El
 * acabado, la nota por línea y los datos de entrega se anexan a esos dos campos
 * en lugar de inventar un contrato nuevo.
 */
function buildDetailText(base, lineas) {
  const extras = lineas.filter(Boolean);
  if (extras.length === 0) {
    return base;
  }

  return `${base}\n\n${extras.join("\n")}`.slice(0, 1000);
}

function QuotationRequest({ embedded = false, onSubmitted } = {}) {
  const fileInputRef = useRef(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [requestedProducts, setRequestedProducts] = useState([]);
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [createdTrackingNumber, setCreatedTrackingNumber] = useState("");
  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [projectCity, setProjectCity] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [companyPhone, setCompanyPhone] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError("");

      try {
        const response = await getCatalogProducts({
          page: 1,
          pageSize: 100,
          signal: controller.signal,
        });
        const products = getResponseItems(response)
          .map(normalizeProduct)
          .filter((product) => product.idProducto > 0);

        setAvailableProducts(products);
        setRequestedProducts(
          products.length > 0
            ? [createProductRow(products[0].idProducto, products[0].material)]
            : []
        );
      } catch (error) {
        if (error?.name !== "AbortError") {
          setProductsError(
            error?.message || "No fue posible cargar los productos."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();
    return () => controller.abort();
  }, []);

  // El botón de WhatsApp solo aparece si la empresa tiene teléfono publicado.
  useEffect(() => {
    let vigente = true;

    getCompanyInfo()
      .then((informacion) => {
        if (vigente && informacion?.telefono) {
          setCompanyPhone(String(informacion.telefono).replace(/[^\d]/g, ""));
        }
      })
      .catch(() => {
        // Sin teléfono el bloque se omite; no es un error de la solicitud.
      });

    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    const nextPreviews = images.map((image) => ({
      file: image,
      url: URL.createObjectURL(image),
    }));
    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [images]);

  const productsById = useMemo(() => {
    const mapa = new Map();
    availableProducts.forEach((product) => mapa.set(product.idProducto, product));
    return mapa;
  }, [availableProducts]);

  const suggestions = useMemo(() => {
    const elegidos = new Set(
      requestedProducts.map((row) => Number(row.idProducto))
    );
    return availableProducts.filter(
      (product) => !elegidos.has(product.idProducto)
    );
  }, [availableProducts, requestedProducts]);

  const visibleSuggestions = suggestions.slice(
    suggestionIndex,
    suggestionIndex + 2
  );

  const clearConfirmation = () => setCreatedTrackingNumber("");

  const handleImagesSelected = async (event) => {
    const selectedImages = Array.from(event.target.files || []);
    const validationMessage = validateSelectedImages(selectedImages);

    if (validationMessage) {
      event.target.value = "";
      await Swal.fire({
        icon: "warning",
        title: "Imágenes no válidas",
        text: validationMessage,
      });
      return;
    }

    setImages(selectedImages);
    clearConfirmation();
  };

  const removeImage = (imageToRemove) => {
    setImages((currentImages) =>
      currentImages.filter((image) => image !== imageToRemove)
    );
    clearConfirmation();
  };

  const updateProductRow = (rowKey, field, value) => {
    setRequestedProducts((currentRows) =>
      currentRows.map((row) =>
        row.key === rowKey ? { ...row, [field]: value } : row
      )
    );
    clearConfirmation();
  };

  const changeQuantity = (row, delta) => {
    const siguiente = Math.min(1000, Math.max(1, Number(row.cantidad) + delta));
    updateProductRow(row.key, "cantidad", siguiente);
  };

  const addProductRow = (idProducto = "") => {
    const producto = productsById.get(Number(idProducto));
    setRequestedProducts((currentRows) => [
      ...currentRows,
      createProductRow(
        idProducto || availableProducts[0]?.idProducto || "",
        producto?.material || availableProducts[0]?.material || ""
      ),
    ]);
    clearConfirmation();
  };

  const removeProductRow = (rowKey) => {
    setRequestedProducts((currentRows) =>
      currentRows.filter((row) => row.key !== rowKey)
    );
    clearConfirmation();
  };

  const goToStep = async (siguiente) => {
    if (siguiente > 1) {
      const productValidationMessage =
        validateRequestedProducts(requestedProducts);
      if (productValidationMessage) {
        await Swal.fire({
          icon: "warning",
          title: "Productos requeridos",
          text: productValidationMessage,
        });
        return;
      }
    }

    if (siguiente > 2) {
      if (!description.trim() || !preferences.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Información requerida",
          text: "Completa la descripción y las preferencias de la solicitud.",
        });
        return;
      }

      const imageValidationMessage = validateSelectedImages(images);
      if (imageValidationMessage) {
        await Swal.fire({
          icon: "warning",
          title: "Imágenes requeridas",
          text: imageValidationMessage,
        });
        return;
      }
    }

    setStep(Math.min(QUOTATION_STEPS.length, Math.max(1, siguiente)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (step < QUOTATION_STEPS.length) {
      await goToStep(step + 1);
      return;
    }

    const trimmedDescription = description.trim();
    const trimmedPreferences = preferences.trim();
    const productValidationMessage =
      validateRequestedProducts(requestedProducts);

    if (productValidationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "Productos requeridos",
        text: productValidationMessage,
      });
      return;
    }

    if (!trimmedDescription || !trimmedPreferences) {
      await Swal.fire({
        icon: "warning",
        title: "Información requerida",
        text: "Completa la descripción y las preferencias de la solicitud.",
      });
      return;
    }

    const imageValidationMessage = validateSelectedImages(images);
    if (imageValidationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "Imágenes requeridas",
        text: imageValidationMessage,
      });
      return;
    }

    setSubmitting(true);
    clearConfirmation();

    const notasPorLinea = requestedProducts
      .map((row) => {
        const producto = productsById.get(Number(row.idProducto));
        const detalles = [row.acabado?.trim(), row.nota?.trim()].filter(Boolean);
        if (detalles.length === 0) {
          return "";
        }
        return `- ${producto?.nombre || "Producto"} (x${row.cantidad}): ${detalles.join(" · ")}`;
      })
      .filter(Boolean);

    const datosEntrega = [
      deliveryMethod ? `Método de entrega: ${deliveryMethod}` : "",
      requiredDate ? `Fecha estimada requerida: ${requiredDate}` : "",
      projectCity ? `Ubicación del proyecto: ${projectCity}` : "",
    ];

    try {
      const result = await createQuotation({
        descripcion: buildDetailText(trimmedDescription, notasPorLinea),
        preferencias: buildDetailText(trimmedPreferences, datosEntrega),
        productos: requestedProducts.map((row) => ({
          idProducto: Number(row.idProducto),
          cantidad: Number(row.cantidad),
        })),
        imagenes: images,
      });

      if (!result?.exitoso) {
        throw new Error(
          result?.mensaje || "No fue posible registrar la cotización."
        );
      }

      setCreatedTrackingNumber(result.numeroSeguimiento);
      setDescription("");
      setPreferences("");
      setImages([]);
      setDeliveryMethod("");
      setRequiredDate("");
      setProjectCity("");
      setStep(1);
      setRequestedProducts(
        availableProducts.length > 0
          ? [
              createProductRow(
                availableProducts[0].idProducto,
                availableProducts[0].material
              ),
            ]
          : []
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Swal.fire({
        icon: "success",
        title: "Solicitud recibida",
        text: `${result.numeroSeguimiento} fue registrada y esta lista para ser procesada por el equipo administrativo.`,
      });

      // Al abrirse desde el historial, este se refresca y el dialogo cierra.
      if (typeof onSubmitted === "function") {
        onSubmitted(result);
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo enviar la cotización",
        text: error?.message || "Intenta enviar la solicitud nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = companyPhone
    ? `https://wa.me/${companyPhone}?text=${encodeURIComponent(
        "Hola, quiero cotizar productos de Concre Innova."
      )}`
    : "";

  return (
    <section className={`quotation-request-page ${embedded ? "is-embedded" : ""}`.trim()}>
      <form className="quotation-request-form" onSubmit={handleSubmit}>
        <div className="quotation-layout">
          <div className="quotation-main">
            <header className="quotation-request-header" hidden={embedded}>
              <h1>Carrito de cotización</h1>
            </header>

            <ol className="quotation-steps" aria-label="Progreso de la solicitud">
              {QUOTATION_STEPS.map((paso, indice) => {
                const numero = indice + 1;
                const estado =
                  numero === step ? "is-current" : numero < step ? "is-done" : "";
                return (
                  <li className={`quotation-step ${estado}`.trim()} key={paso.titulo}>
                    <span className="quotation-step-number" aria-hidden="true">
                      {numero}
                    </span>
                    <span className="quotation-step-text">
                      <strong>{paso.titulo}</strong>
                      <small>{paso.detalle}</small>
                    </span>
                  </li>
                );
              })}
            </ol>
            {step === 1 && (
              <section className="quotation-card quotation-products-card">
                {loadingProducts && (
                  <p className="quotation-card-status">Cargando productos...</p>
                )}
                {productsError && (
                  <p className="quotation-products-error" role="alert">
                    {productsError}
                  </p>
                )}

                <div className="quotation-table-wrapper">
                  <table className="quotation-table">
                    <thead>
                      <tr>
                        <th scope="col">Producto</th>
                        <th scope="col">Código</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Color / Acabado</th>
                        <th scope="col">Observaciones</th>
                        <th scope="col">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestedProducts.map((row, index) => {
                        const producto = productsById.get(Number(row.idProducto));
                        return (
                          <tr key={row.key}>
                            <td className="quotation-cell-product">
                              <span className="quotation-thumb">
                                {producto && (
                                  <img
                                    src={getCatalogProductImage(producto)}
                                    alt=""
                                    aria-hidden="true"
                                    onError={(event) =>
                                      handleCatalogImageFallback(
                                        event,
                                        producto.imagen
                                      )
                                    }
                                  />
                                )}
                              </span>
                              <select
                                aria-label={`Producto ${index + 1}`}
                                value={row.idProducto}
                                required
                                onChange={(event) => {
                                  const nuevo = productsById.get(
                                    Number(event.target.value)
                                  );
                                  updateProductRow(
                                    row.key,
                                    "idProducto",
                                    event.target.value
                                  );
                                  updateProductRow(
                                    row.key,
                                    "acabado",
                                    nuevo?.material || ""
                                  );
                                }}
                                disabled={submitting}
                              >
                                <option value="">Seleccionar producto</option>
                                {availableProducts.map((product) => (
                                  <option
                                    key={product.idProducto}
                                    value={product.idProducto}
                                  >
                                    {product.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="quotation-cell-code">
                              {buildProductCode(row.idProducto)}
                            </td>

                            <td>
                              <div className="quotation-quantity">
                                <button
                                  type="button"
                                  aria-label={`Disminuir cantidad ${index + 1}`}
                                  onClick={() => changeQuantity(row, -1)}
                                  disabled={submitting || row.cantidad <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  step="1"
                                  required
                                  aria-label={`Cantidad ${index + 1}`}
                                  value={row.cantidad}
                                  onChange={(event) =>
                                    updateProductRow(
                                      row.key,
                                      "cantidad",
                                      event.target.value
                                    )
                                  }
                                  disabled={submitting}
                                />
                                <button
                                  type="button"
                                  aria-label={`Aumentar cantidad ${index + 1}`}
                                  onClick={() => changeQuantity(row, 1)}
                                  disabled={submitting || row.cantidad >= 1000}
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td>
                              <div className="quotation-finish">
                                <span
                                  className="quotation-swatch"
                                  aria-hidden="true"
                                  style={{
                                    background: getFinishSwatch(row.acabado),
                                  }}
                                />
                                <input
                                  type="text"
                                  maxLength={MAX_FINISH_LENGTH}
                                  aria-label={`Color o acabado ${index + 1}`}
                                  placeholder="Color o acabado"
                                  value={row.acabado}
                                  onChange={(event) =>
                                    updateProductRow(
                                      row.key,
                                      "acabado",
                                      event.target.value
                                    )
                                  }
                                  disabled={submitting}
                                />
                              </div>
                            </td>

                            <td>
                              {row.notaAbierta || row.nota ? (
                                <textarea
                                  rows={2}
                                  maxLength={MAX_NOTE_LENGTH}
                                  aria-label={`Observaciones ${index + 1}`}
                                  placeholder="Detalle para esta línea"
                                  value={row.nota}
                                  onChange={(event) =>
                                    updateProductRow(
                                      row.key,
                                      "nota",
                                      event.target.value
                                    )
                                  }
                                  disabled={submitting}
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="quotation-ghost-button"
                                  onClick={() =>
                                    updateProductRow(row.key, "notaAbierta", true)
                                  }
                                  disabled={submitting}
                                >
                                  <MessageSquare size={15} aria-hidden="true" />
                                  Agregar nota
                                </button>
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="quotation-delete-button"
                                aria-label={`Eliminar producto ${index + 1}`}
                                onClick={() => removeProductRow(row.key)}
                                disabled={
                                  submitting || requestedProducts.length === 1
                                }
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="quotation-add-button"
                  onClick={() => addProductRow()}
                  disabled={
                    submitting ||
                    loadingProducts ||
                    requestedProducts.length >= MAX_REQUESTED_PRODUCTS
                  }
                >
                  <Plus size={17} aria-hidden="true" />
                  Agregar más productos
                </button>
              </section>
            )}

            {step === 1 && suggestions.length > 0 && (
              <section className="quotation-card quotation-suggestions">
                <h2>También podría interesarte</h2>
                <div className="quotation-suggestions-row">
                  <button
                    type="button"
                    className="quotation-carousel-control"
                    aria-label="Ver sugerencias anteriores"
                    onClick={() =>
                      setSuggestionIndex((actual) => Math.max(0, actual - 2))
                    }
                    disabled={suggestionIndex === 0}
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>

                  <div className="quotation-suggestion-list">
                    {visibleSuggestions.map((producto) => (
                      <article
                        className="quotation-suggestion"
                        key={producto.idProducto}
                      >
                        <img
                          src={getCatalogProductImage(producto)}
                          alt={producto.nombre}
                          onError={(event) =>
                            handleCatalogImageFallback(event, producto.imagen)
                          }
                        />
                        <div>
                          <strong>{producto.nombre}</strong>
                          <p>{producto.descripcion}</p>
                          <button
                            type="button"
                            className="quotation-ghost-button"
                            onClick={() => addProductRow(producto.idProducto)}
                            disabled={
                              submitting ||
                              requestedProducts.length >= MAX_REQUESTED_PRODUCTS
                            }
                          >
                            Agregar a la cotización
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="quotation-carousel-control"
                    aria-label="Ver más sugerencias"
                    onClick={() =>
                      setSuggestionIndex((actual) =>
                        Math.min(Math.max(0, suggestions.length - 2), actual + 2)
                      )
                    }
                    disabled={suggestionIndex + 2 >= suggestions.length}
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="quotation-card quotation-details-card">
                <h2>Datos del proyecto</h2>

                <label htmlFor="quotation-description">Descripción</label>
                <textarea
                  id="quotation-description"
                  value={description}
                  maxLength={1000}
                  rows={5}
                  required
                  onChange={(event) => {
                    setDescription(event.target.value);
                    clearConfirmation();
                  }}
                  placeholder="Describe medidas, espacio, uso y cualquier detalle relevante."
                  disabled={submitting}
                />
                <div className="quotation-character-count">
                  {description.length}/1000
                </div>

                <label htmlFor="quotation-preferences">Preferencias</label>
                <textarea
                  id="quotation-preferences"
                  value={preferences}
                  maxLength={1000}
                  rows={4}
                  required
                  onChange={(event) => {
                    setPreferences(event.target.value);
                    clearConfirmation();
                  }}
                  placeholder="Indica materiales, colores, tamaños, acabados o presupuesto preferido."
                  disabled={submitting}
                />
                <div className="quotation-character-count">
                  {preferences.length}/1000
                </div>

                <div className="quotation-images-heading">
                  <div>
                    <strong>Imagenes de referencia</strong>
                    <span>
                      {images.length}/{MAX_IMAGES}
                    </span>
                  </div>
                  <label
                    className="quotation-file-button"
                    htmlFor="quotation-images"
                  >
                    <ImagePlus size={18} aria-hidden="true" />
                    Adjuntar imagenes
                  </label>
                  <input
                    ref={fileInputRef}
                    id="quotation-images"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImagesSelected}
                    disabled={submitting}
                  />
                </div>

                {previews.length > 0 && (
                  <div className="quotation-image-grid">
                    {previews.map(({ file, url }) => (
                      <article
                        className="quotation-image-preview"
                        key={`${file.name}-${file.lastModified}`}
                      >
                        <img src={url} alt={`Referencia ${file.name}`} />
                        <div>
                          <strong>{file.name}</strong>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Eliminar ${file.name}`}
                          title="Eliminar imagen"
                          onClick={() => removeImage(file)}
                          disabled={submitting}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="quotation-card quotation-review-card">
                <h2>Revisa tu solicitud</h2>
                <ul className="quotation-review-list">
                  {requestedProducts.map((row) => {
                    const producto = productsById.get(Number(row.idProducto));
                    return (
                      <li key={row.key}>
                        <strong>{producto?.nombre || "Producto"}</strong>
                        <span>
                          {buildProductCode(row.idProducto)} · {row.cantidad}{" "}
                          unidad(es)
                          {row.acabado ? ` · ${row.acabado}` : ""}
                        </span>
                        {row.nota && <p>{row.nota}</p>}
                      </li>
                    );
                  })}
                </ul>

                <dl className="quotation-review-data">
                  <div>
                    <dt>Método de entrega</dt>
                    <dd>{deliveryMethod || "Por coordinar"}</dd>
                  </div>
                  <div>
                    <dt>Fecha estimada</dt>
                    <dd>{requiredDate || "Por definir"}</dd>
                  </div>
                  <div>
                    <dt>Ubicación</dt>
                    <dd>{projectCity || "Por definir"}</dd>
                  </div>
                  <div>
                    <dt>Imágenes adjuntas</dt>
                    <dd>{images.length}</dd>
                  </div>
                </dl>

                {createdTrackingNumber && (
                  <p className="quotation-success" role="status">
                    Solicitud {createdTrackingNumber} recibida y lista para
                    procesarse.
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="quotation-summary" aria-label="Resumen de cotización">
            <h2>Resumen de cotización</h2>

            <div className="quotation-summary-subtotal">
              <div>
                <strong>Subtotal estimado</strong>
                <p>
                  El subtotal se calculará al completar los datos del proyecto.
                </p>
              </div>
              <span aria-hidden="true">— — —</span>
            </div>

            <label htmlFor="quotation-delivery">Método de entrega</label>
            <div className="quotation-field">
              <Truck size={17} aria-hidden="true" />
              <select
                id="quotation-delivery"
                value={deliveryMethod}
                onChange={(event) => setDeliveryMethod(event.target.value)}
                disabled={submitting}
              >
                <option value="">Selecciona una opción</option>
                {DELIVERY_OPTIONS.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <label htmlFor="quotation-date">Fecha estimada requerida</label>
            <div className="quotation-field">
              <Calendar size={17} aria-hidden="true" />
              <input
                id="quotation-date"
                type="date"
                value={requiredDate}
                onChange={(event) => setRequiredDate(event.target.value)}
                disabled={submitting}
              />
            </div>

            <label htmlFor="quotation-city">Ubicación del proyecto</label>
            <div className="quotation-field">
              <MapPin size={17} aria-hidden="true" />
              <select
                id="quotation-city"
                value={projectCity}
                onChange={(event) => setProjectCity(event.target.value)}
                disabled={submitting}
              >
                <option value="">Selecciona una provincia</option>
                {PROVINCE_OPTIONS.map((provincia) => (
                  <option key={provincia} value={provincia}>
                    {provincia}
                  </option>
                ))}
              </select>
            </div>

            <div className="quotation-help">
              <Headphones size={26} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <strong>¿Necesitas ayuda?</strong>
                <p>
                  Nuestro equipo está listo para asesorarte y crear la mejor
                  solución para tu proyecto.
                </p>
                <a href="/contacto">Contáctanos</a>
              </div>
            </div>

            {step > 1 && (
              <button
                type="button"
                className="quotation-back-button"
                onClick={() => setStep(step - 1)}
                disabled={submitting}
              >
                Volver al paso anterior
              </button>
            )}

            <button
              type="submit"
              className="quotation-continue-button"
              disabled={submitting || loadingProducts || Boolean(productsError)}
            >
              {step === QUOTATION_STEPS.length ? (
                <>
                  <Send size={17} aria-hidden="true" />
                  {submitting ? "Enviando..." : "Enviar solicitud"}
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>

            {whatsappHref && (
              <a
                className="quotation-whatsapp-button"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Cotizar por WhatsApp
              </a>
            )}
          </aside>
        </div>
      </form>

      <section className="quotation-trust" aria-label="Por qué cotizar con nosotros">
        {TRUST_ITEMS.map(({ Icono, titulo, detalle }) => (
          <article key={titulo}>
            <Icono size={30} strokeWidth={1.4} aria-hidden="true" />
            <div>
              <strong>{titulo}</strong>
              <p>{detalle}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

export default QuotationRequest;
