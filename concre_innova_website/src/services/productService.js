import { request } from "./apiClient";

function extractImagePath(data) {
  if (!data) {
    return "";
  }

  if (typeof data === "string") {
    return data;
  }

  return (
    data.ruta ||
    data.path ||
    data.url ||
    data.imagen ||
    data.image ||
    data.data?.ruta ||
    data.data?.path ||
    data.data?.url ||
    data.data?.imagen ||
    data.data?.image ||
    ""
  );
}

export async function createProduct(product) {
  return await request("/api/Productos", {
    method: "POST",
    body: product,
  });
}

export async function updateProduct(idProducto, product) {
  return await request(`/api/Productos/${idProducto}`, {
    method: "PUT",
    body: product,
  });
}

export async function deleteProduct(idProducto) {
  return await request(`/api/Productos/${idProducto}`, {
    method: "DELETE",
  });
}

export async function uploadProductImage(file) {
  const endpoints = [
    process.env.REACT_APP_UPLOAD_PRODUCT_IMAGE_PATH,
    "/api/Productos/upload-image",
    "/api/Productos/imagen",
    "/api/Imagenes/upload",
  ].filter(Boolean);
  const methods = ["POST", "PUT"];
  const fieldNames = ["file", "imagen", "image", "archivo"];

  let lastError = null;

  for (const endpoint of endpoints) {
    for (const method of methods) {
      for (const fieldName of fieldNames) {
        const formData = new FormData();
        formData.append(fieldName, file);

        try {
          const response = await request(endpoint, {
            method,
            body: formData,
          });

          const imagePath = extractImagePath(response);
          if (!imagePath) {
            throw new Error("La API no devolvio la ruta de la imagen.");
          }

          return imagePath;
        } catch (error) {
          lastError = error;

          // Sigue probando combinaciones si la API rechaza ruta/metodo/formato/campo.
          if ([400, 404, 405, 415].includes(error?.status)) {
            continue;
          }

          throw error;
        }
      }
    }
  }

  if (lastError?.status === 405) {
    throw new Error(
      "La API de imagen existe pero no permite este metodo. Configura REACT_APP_UPLOAD_PRODUCT_IMAGE_PATH con el endpoint correcto de carga."
    );
  }

  if (lastError?.status === 404) {
    throw new Error(
      "No se encontro endpoint de carga de imagen. Configura REACT_APP_UPLOAD_PRODUCT_IMAGE_PATH."
    );
  }

  if (lastError?.status === 400) {
    throw new Error(
      "La API de imagen rechazo la solicitud (400). Verifica el campo esperado para archivo en backend."
    );
  }

  if (lastError?.status === 415) {
    throw new Error(
      "La API no acepto el formato enviado (415). Verifica que el endpoint acepte multipart/form-data."
    );
  }

  throw lastError || new Error("No se encontro endpoint para subir imagenes.");
}
