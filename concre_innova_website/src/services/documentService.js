import { formatCatalogPrice } from "./catalogPresentationService";
import { desglosarImpuesto, formatearPorcentajeImpuesto } from "./pricingService";

/**
 * Generador único de documentos descargables. Antes cada pantalla volcaba los
 * datos en crudo; aquí se arma una hoja con la identidad de Concre Innova
 * (encabezado, tipografía, tabla y totales) y se abre el diálogo de impresión,
 * de modo que el archivo resultante sea un PDF con diseño.
 */

const EMPRESA = {
  nombre: "Concre Innova",
  descripcion: "Maceteros de concreto · San Miguel Oeste, Naranjo, Alajuela",
  correo: "contacto@concreinnova.com",
  telefono: "+506 8888-8888",
};

function escapar(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatearFecha(valor) {
  if (!valor) return "Sin fecha";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? "Sin fecha"
    : fecha.toLocaleDateString("es-CR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

const ESTILOS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "DM Sans", "Segoe UI", Arial, sans-serif;
    color: #16140f;
    font-size: 12px;
    line-height: 1.5;
  }
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 16px;
    border-bottom: 3px solid #314d37;
  }
  .doc-brand strong { display: block; font-size: 20px; color: #17251a; letter-spacing: -0.01em; }
  .doc-brand span { display: block; color: #5f5749; font-size: 11px; margin-top: 3px; }
  .doc-meta { text-align: right; }
  .doc-meta .doc-type {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    background: #e7ebdd;
    color: #243a29;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .doc-meta strong { display: block; font-size: 16px; margin-top: 6px; }
  .doc-meta span { display: block; color: #5f5749; font-size: 11px; }
  .doc-badge {
    display: inline-block;
    margin-top: 6px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .doc-badge.pagada { background: rgba(37,108,61,.14); color: #256c3d; }
  .doc-badge.pendiente { background: rgba(154,101,8,.14); color: #9a6508; }
  .doc-badge.vencida { background: rgba(155,47,34,.14); color: #9b2f22; }
  .doc-badge.revision { background: rgba(49,77,55,.14); color: #314d37; }
  .doc-parties { display: flex; gap: 32px; margin: 22px 0 18px; }
  .doc-party { flex: 1; }
  .doc-party h3 {
    margin: 0 0 6px;
    font-size: 10px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #314d37;
  }
  .doc-party p { margin: 0; color: #302c25; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th {
    background: #f0eee7;
    border-bottom: 2px solid #ded6c7;
    padding: 9px 10px;
    text-align: left;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #302c25;
  }
  tbody td { border-bottom: 1px solid #ded6c7; padding: 9px 10px; }
  .num { text-align: right; white-space: nowrap; }
  .doc-totals { margin-left: auto; margin-top: 16px; width: 260px; }
  .doc-totals tr td { border: none; padding: 4px 0; color: #5f5749; }
  .doc-totals tr.final td {
    border-top: 2px solid #314d37;
    padding-top: 9px;
    color: #17251a;
    font-size: 15px;
    font-weight: 800;
  }
  .doc-note {
    margin-top: 18px;
    padding: 11px 13px;
    border-left: 3px solid #a66a43;
    background: #f7f4ee;
    color: #5f5749;
  }
  .doc-footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #ded6c7;
    color: #5f5749;
    font-size: 10px;
    display: flex;
    justify-content: space-between;
  }
`;

function envolver({ titulo, tipo, numero, fecha, estado, partes, cuerpo }) {
  const insignia = estado
    ? `<span class="doc-badge ${escapar(estado.clave)}">${escapar(estado.texto)}</span>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapar(titulo)}</title>
  <style>${ESTILOS}</style>
</head>
<body>
  <header class="doc-header">
    <div class="doc-brand">
      <strong>${EMPRESA.nombre}</strong>
      <span>${EMPRESA.descripcion}</span>
      <span>${EMPRESA.correo} · ${EMPRESA.telefono}</span>
    </div>
    <div class="doc-meta">
      <span class="doc-type">${escapar(tipo)}</span>
      <strong>${escapar(numero)}</strong>
      <span>${escapar(fecha)}</span>
      ${insignia}
    </div>
  </header>

  ${partes}
  ${cuerpo}

  <footer class="doc-footer">
    <span>${EMPRESA.nombre} · Documento generado el ${formatearFecha(new Date())}</span>
    <span>Precios en colones costarricenses, IVA incluido</span>
  </footer>
</body>
</html>`;
}

function tablaTotales(total) {
  const desglose = desglosarImpuesto(Number(total) || 0);

  return `
  <table class="doc-totals">
    <tr>
      <td>Subtotal</td>
      <td class="num">${escapar(formatCatalogPrice(desglose.subtotal))}</td>
    </tr>
    <tr>
      <td>IVA (${escapar(formatearPorcentajeImpuesto(desglose.tasa))}) incluido</td>
      <td class="num">${escapar(formatCatalogPrice(desglose.impuesto))}</td>
    </tr>
    <tr class="final">
      <td>Total</td>
      <td class="num">${escapar(formatCatalogPrice(desglose.total))}</td>
    </tr>
  </table>`;
}

const ESTADOS_FACTURA = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  vencida: "Vencida",
  revision: "En revisión",
};

function construirFactura(factura) {
  const lineas = (factura.lineas || [])
    .map(
      (linea) => `
      <tr>
        <td>${escapar(linea.nombreProducto)}${
          linea.nombreVariante ? ` · ${escapar(linea.nombreVariante)}` : ""
        }</td>
        <td class="num">${Number(linea.cantidad) || 0}</td>
        <td class="num">${escapar(formatCatalogPrice(linea.precioUnitario))}</td>
        <td class="num">${escapar(formatCatalogPrice(linea.subtotal))}</td>
      </tr>`
    )
    .join("");

  const pagos = (factura.pagos || [])
    .map(
      (pago) => `
      <tr>
        <td>${escapar(pago.metodoPago || "No indicado")}</td>
        <td>${escapar(pago.referencia || "Sin referencia")}</td>
        <td>${escapar(formatearFecha(pago.fechaPago))}</td>
        <td class="num">${escapar(formatCatalogPrice(pago.monto))}</td>
      </tr>`
    )
    .join("");

  const partes = `
  <section class="doc-parties">
    <div class="doc-party">
      <h3>Facturado a</h3>
      <p><strong>${escapar(factura.cliente || "Cliente")}</strong></p>
      <p>${escapar(factura.correoCliente || "Sin correo")}</p>
      <p>${escapar(factura.telefonoCliente || "Sin teléfono")}</p>
    </div>
    <div class="doc-party">
      <h3>Entrega</h3>
      <p>${escapar(factura.direccionEntrega || "No indicada")}</p>
    </div>
    <div class="doc-party">
      <h3>Condiciones</h3>
      <p>Pedido #${escapar(factura.idPedido)} · ${escapar(factura.estadoPedido || "")}</p>
      <p>Método: ${escapar(factura.metodoPago || "No indicado")}</p>
      <p>Vence: ${escapar(formatearFecha(factura.fechaVencimiento))}</p>
    </div>
  </section>`;

  const cuerpo = `
  <table>
    <thead>
      <tr>
        <th>Detalle</th>
        <th class="num">Cant.</th>
        <th class="num">Precio</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineas || '<tr><td colspan="4">Sin líneas registradas.</td></tr>'}</tbody>
  </table>

  ${tablaTotales(factura.total)}

  <h3 style="margin-top:26px;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#314d37;">
    Pagos registrados
  </h3>
  <table>
    <thead>
      <tr>
        <th>Método</th>
        <th>Referencia</th>
        <th>Fecha</th>
        <th class="num">Monto</th>
      </tr>
    </thead>
    <tbody>${pagos || '<tr><td colspan="4">Sin pagos registrados.</td></tr>'}</tbody>
  </table>

  ${
    factura.observaciones
      ? `<p class="doc-note"><strong>Observaciones:</strong> ${escapar(factura.observaciones)}</p>`
      : ""
  }`;

  return envolver({
    titulo: `Factura ${factura.idVenta} - ${EMPRESA.nombre}`,
    tipo: "Factura",
    numero: `N.º ${factura.idVenta}`,
    fecha: formatearFecha(factura.fechaVenta),
    estado: {
      clave: factura.estadoFactura || "pendiente",
      texto: ESTADOS_FACTURA[factura.estadoFactura] || "Pendiente",
    },
    partes,
    cuerpo,
  });
}

function construirPedido(pedido) {
  const lineas = (pedido.items || pedido.lineas || [])
    .map(
      (linea) => `
      <tr>
        <td>${escapar(linea.nombre || linea.nombreProducto)}</td>
        <td class="num">${Number(linea.cantidad) || 0}</td>
        <td class="num">${escapar(formatCatalogPrice(linea.precio ?? linea.precioUnitario))}</td>
        <td class="num">${escapar(formatCatalogPrice(linea.subtotal))}</td>
      </tr>`
    )
    .join("");

  const partes = `
  <section class="doc-parties">
    <div class="doc-party">
      <h3>Cliente</h3>
      <p><strong>${escapar(pedido.cliente || "Cliente")}</strong></p>
    </div>
    <div class="doc-party">
      <h3>Entrega</h3>
      <p>${escapar(pedido.direccionEntrega || "No indicada")}</p>
    </div>
    <div class="doc-party">
      <h3>Pago</h3>
      <p>${escapar(pedido.metodoPago || "No indicado")}</p>
      ${pedido.referencia ? `<p>Ref. ${escapar(pedido.referencia)}</p>` : ""}
    </div>
  </section>`;

  const cuerpo = `
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="num">Cant.</th>
        <th class="num">Precio</th>
        <th class="num">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineas || '<tr><td colspan="4">Sin productos.</td></tr>'}</tbody>
  </table>

  ${tablaTotales(pedido.total)}`;

  return envolver({
    titulo: `Comprobante ${pedido.idPedido} - ${EMPRESA.nombre}`,
    tipo: "Comprobante de compra",
    numero: `Pedido N.º ${pedido.idPedido}`,
    fecha: formatearFecha(pedido.fecha || new Date()),
    partes,
    cuerpo,
  });
}

/**
 * Reporte tabular genérico: recibe columnas y filas ya preparadas por la vista
 * que lo pide, para que cualquier listado se descargue con el mismo diseño.
 */
function construirReporte({ titulo, subtitulo, columnas = [], filas = [], notas }) {
  const encabezado = columnas
    .map((columna) => `<th class="${columna.numerica ? "num" : ""}">${escapar(columna.titulo)}</th>`)
    .join("");

  const cuerpoFilas = filas
    .map(
      (fila) =>
        `<tr>${columnas
          .map(
            (columna) =>
              `<td class="${columna.numerica ? "num" : ""}">${escapar(fila[columna.clave] ?? "")}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const cuerpo = `
  <table>
    <thead><tr>${encabezado}</tr></thead>
    <tbody>${cuerpoFilas || `<tr><td colspan="${columnas.length}">Sin datos.</td></tr>`}</tbody>
  </table>
  ${notas ? `<p class="doc-note">${escapar(notas)}</p>` : ""}`;

  return envolver({
    titulo: `${titulo} - ${EMPRESA.nombre}`,
    tipo: "Reporte",
    numero: titulo,
    fecha: subtitulo || formatearFecha(new Date()),
    partes: "",
    cuerpo,
  });
}

const CONSTRUCTORES = {
  factura: construirFactura,
  pedido: construirPedido,
  reporte: construirReporte,
};

/**
 * Abre el documento en una ventana de impresión, de forma que la persona
 * obtenga un PDF con el diseño de la marca en vez de datos sueltos.
 */
export function descargarDocumento(tipo, datos) {
  const constructor = CONSTRUCTORES[tipo];

  if (!constructor) {
    return false;
  }

  const html = constructor(datos);
  const ventana = window.open("", "_blank", "width=900,height=1000");

  if (!ventana) {
    // Con las ventanas emergentes bloqueadas se ofrece el archivo directamente.
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${tipo}-concre-innova.html`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    return true;
  }

  ventana.document.write(html);
  ventana.document.close();
  ventana.focus();
  ventana.addEventListener("load", () => ventana.print(), { once: true });

  return true;
}

export { construirFactura, construirPedido, construirReporte };
