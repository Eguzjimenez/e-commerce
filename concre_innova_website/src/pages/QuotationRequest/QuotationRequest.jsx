import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, Send, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { getCatalogProducts } from "../../services/catalogService";
import { createQuotation } from "../../services/quotationService";
import "./QuotationRequest.css";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUESTED_PRODUCTS = 50;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
let productRowSequence = 0;

function formatFileSize(size) {
  return `${(Number(size) / (1024 * 1024)).toFixed(2)} MB`;
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
  };
}

function createProductRow(idProducto = "") {
  productRowSequence += 1;
  return {
    key: productRowSequence,
    idProducto,
    cantidad: 1,
  };
}

function validateSelectedImages(files) {
  if (files.length === 0) {
    return "Selecciona al menos una imagen.";
  }

  if (files.length > MAX_IMAGES) {
    return `Solo puedes adjuntar hasta ${MAX_IMAGES} imagenes.`;
  }

  const invalidType = files.find(
    (file) => !ALLOWED_IMAGE_TYPES.has(file.type)
  );
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
    return "Selecciona productos validos y cantidades entre 1 y 1000.";
  }

  if (
    new Set(normalizedRows.map((row) => row.idProducto)).size !==
    normalizedRows.length
  ) {
    return "Un producto no puede aparecer mas de una vez.";
  }

  return null;
}

function QuotationRequest() {
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
            ? [createProductRow(products[0].idProducto)]
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

  const clearConfirmation = () => setCreatedTrackingNumber("");

  const handleImagesSelected = async (event) => {
    const selectedImages = Array.from(event.target.files || []);
    const validationMessage = validateSelectedImages(selectedImages);

    if (validationMessage) {
      event.target.value = "";
      await Swal.fire({
        icon: "warning",
        title: "Imagenes no validas",
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

  const removeProductRow = (rowKey) => {
    setRequestedProducts((currentRows) =>
      currentRows.filter((row) => row.key !== rowKey)
    );
    clearConfirmation();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        title: "Informacion requerida",
        text: "Completa la descripcion y las preferencias de la solicitud.",
      });
      return;
    }

    const imageValidationMessage = validateSelectedImages(images);
    if (imageValidationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "Imagenes requeridas",
        text: imageValidationMessage,
      });
      return;
    }

    setSubmitting(true);
    clearConfirmation();

    try {
      const result = await createQuotation({
        descripcion: trimmedDescription,
        preferencias: trimmedPreferences,
        productos: requestedProducts.map((row) => ({
          idProducto: Number(row.idProducto),
          cantidad: Number(row.cantidad),
        })),
        imagenes: images,
      });

      if (!result?.exitoso) {
        throw new Error(
          result?.mensaje || "No fue posible registrar la cotizacion."
        );
      }

      setCreatedTrackingNumber(result.numeroSeguimiento);
      setDescription("");
      setPreferences("");
      setImages([]);
      setRequestedProducts(
        availableProducts.length > 0
          ? [createProductRow(availableProducts[0].idProducto)]
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
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo enviar la cotizacion",
        text: error?.message || "Intenta enviar la solicitud nuevamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="quotation-request-page">
      <header className="quotation-request-header">
        <span>Cotizaciones</span>
        <h1>Nueva cotización</h1>
      </header>

      <form className="quotation-request-form" onSubmit={handleSubmit}>
        <section className="quotation-request-products">
          <div className="quotation-request-section-heading">
            <div>
              <strong>Productos y cantidades</strong>
              <span>Indica los artículos que necesitas cotizar.</span>
            </div>
            <button
              type="button"
              title="Agregar producto"
              aria-label="Agregar producto"
              onClick={() =>
                setRequestedProducts((currentRows) => [
                  ...currentRows,
                  createProductRow(availableProducts[0]?.idProducto || ""),
                ])
              }
              disabled={
                submitting ||
                loadingProducts ||
                requestedProducts.length >= MAX_REQUESTED_PRODUCTS
              }
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>

          {loadingProducts && <p>Cargando productos...</p>}
          {productsError && (
            <p className="quotation-products-error" role="alert">
              {productsError}
            </p>
          )}

          <div className="quotation-request-product-list">
            {requestedProducts.map((row, index) => (
              <div className="quotation-request-product-row" key={row.key}>
                <select
                  aria-label={`Producto ${index + 1}`}
                  value={row.idProducto}
                  required
                  onChange={(event) =>
                    updateProductRow(
                      row.key,
                      "idProducto",
                      event.target.value
                    )
                  }
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
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  required
                  aria-label={`Cantidad ${index + 1}`}
                  value={row.cantidad}
                  onChange={(event) =>
                    updateProductRow(row.key, "cantidad", event.target.value)
                  }
                  disabled={submitting}
                />
                <button
                  type="button"
                  title="Eliminar producto"
                  aria-label={`Eliminar producto ${index + 1}`}
                  onClick={() => removeProductRow(row.key)}
                  disabled={submitting || requestedProducts.length === 1}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>

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
            <span>{images.length}/{MAX_IMAGES}</span>
          </div>
          <label className="quotation-file-button" htmlFor="quotation-images">
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

        {createdTrackingNumber && (
          <p className="quotation-success" role="status">
            Solicitud {createdTrackingNumber} recibida y lista para procesarse.
          </p>
        )}

        <button
          type="submit"
          className="quotation-submit-button"
          disabled={submitting || loadingProducts || Boolean(productsError)}
        >
          <Send size={18} aria-hidden="true" />
          {submitting ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>
    </main>
  );
}

export default QuotationRequest;
