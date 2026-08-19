import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 45,
    paddingHorizontal: 45,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
    color: "#24323A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#1F4E5F",
  },
  empresa: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F4E5F",
  },
  empresaSubtitulo: {
    marginTop: 4,
    fontSize: 8,
    color: "#66757D",
  },
  comprobante: {
    textAlign: "right",
  },
  comprobanteTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F4E5F",
  },
  pedidoNumero: {
    marginTop: 4,
    fontSize: 9,
    color: "#66757D",
  },
  titulo: {
    marginTop: 25,
    fontSize: 21,
    fontWeight: "bold",
    color: "#24323A",
  },
  descripcion: {
    marginTop: 6,
    fontSize: 9,
    lineHeight: 1.5,
    color: "#66757D",
  },
  infoContainer: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9E1E5",
    borderRadius: 5,
  },
  infoTitulo: {
    backgroundColor: "#F2F6F8",
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: "#1F4E5F",
  },
  infoFila: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF0",
  },
  infoLabel: {
    width: "48%",
    fontSize: 8,
    color: "#66757D",
  },
  infoValor: {
    width: "52%",
    fontSize: 8,
    fontWeight: "bold",
    color: "#24323A",
  },
  seccionTitulo: {
    marginTop: 22,
    marginBottom: 7,
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F4E5F",
  },
  tabla: {
    borderWidth: 1,
    borderColor: "#D9E1E5",
    borderRadius: 4,
  },
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: "#1F4E5F",
    paddingVertical: 8,
    paddingHorizontal: 7,
  },
  tablaFila: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 7,
    borderTopWidth: 1,
    borderTopColor: "#E5EAED",
  },
  producto: {
    width: "45%",
    fontSize: 8.5,
  },
  cantidad: {
    width: "15%",
    fontSize: 8.5,
    textAlign: "center",
  },
  precio: {
    width: "20%",
    fontSize: 8.5,
    textAlign: "right",
  },
  subtotal: {
    width: "20%",
    fontSize: 8.5,
    textAlign: "right",
  },
  headerTexto: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  productoNombre: {
    fontWeight: "bold",
    color: "#24323A",
  },
  totalContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    width: 220,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F6F8",
    borderWidth: 1,
    borderColor: "#D9E1E5",
    borderRadius: 5,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#66757D",
  },
  total: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1F4E5F",
  },
  pagoConfirmado: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F1F8F4",
    borderWidth: 1,
    borderColor: "#CFE5D9",
    borderRadius: 5,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#237A57",
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 15,
    paddingTop: 3,
    marginRight: 9,
  },
  pagoTitulo: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#237A57",
  },
  pagoTexto: {
    marginTop: 3,
    fontSize: 8,
    color: "#66757D",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 45,
    right: 45,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: "#D9E1E5",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerTexto: {
    fontSize: 7,
    color: "#66757D",
  },
});

function formatearDinero(valor) {
  const numero = Number(valor || 0);
  return `$${numero.toFixed(2)}`;
}

function DocumentoComprobante({ pedido }) {
  const productos = Array.isArray(pedido?.items) ? pedido.items : [];

  const subtotalCalculado = productos.reduce(
    (total, producto) =>
      total +
      Number(producto.precioUnitario || producto.precio || 0) *
        Number(producto.cantidad || 0),
    0
  );

  const subtotal =
    pedido?.subtotal !== undefined ? Number(pedido.subtotal) : subtotalCalculado;
  const iva = pedido?.iva !== undefined ? Number(pedido.iva) : 0;
  const total = pedido?.total !== undefined ? Number(pedido.total) : subtotal + iva;

  return (
    <Document
      title={`Comprobante de compra - Pedido #${pedido?.idPedido}`}
      author="Concre Innova"
      subject="Comprobante digital de compra"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.empresa}>CONCRE INNOVA</Text>
            <Text style={styles.empresaSubtitulo}>Productos y soluciones en concreto</Text>
          </View>

          <View style={styles.comprobante}>
            <Text style={styles.comprobanteTitulo}>COMPROBANTE DE COMPRA</Text>
            <Text style={styles.pedidoNumero}>Pedido #{pedido?.idPedido}</Text>
          </View>
        </View>

        <Text style={styles.titulo}>Gracias por tu compra</Text>
        <Text style={styles.descripcion}>
          A continuación encontrarás el detalle de tu pedido y la información asociada al pago.
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitulo}>INFORMACIÓN DEL PEDIDO</Text>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Número de pedido</Text>
              <Text style={styles.infoValor}>#{pedido?.idPedido}</Text>
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Fecha</Text>
              <Text style={styles.infoValor}>{pedido?.fecha || "-"}</Text>
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValor}>{pedido?.cliente || pedido?.idUsuario || "-"}</Text>
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValor}>{pedido?.direccionEntrega || pedido?.direccion || "-"}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitulo}>INFORMACIÓN DE PAGO</Text>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Método de pago</Text>
              <Text style={styles.infoValor}>{pedido?.metodoPago || "-"}</Text>
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Tarjeta</Text>
              <Text style={styles.infoValor}>
                {pedido?.last4 ? `•••• ${pedido.last4}` : pedido?.tarjeta ? `•••• ${pedido.tarjeta}` : "-"}
              </Text>
            </View>

            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={[styles.infoValor, { color: "#237A57" }]}>
                {pedido?.estadoPago || "Pagado"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.seccionTitulo}>DETALLE DE LA COMPRA</Text>

        <View style={styles.tabla}>
          <View style={styles.tablaHeader}>
            <Text style={[styles.producto, styles.headerTexto]}>PRODUCTO</Text>
            <Text style={[styles.cantidad, styles.headerTexto]}>CANT.</Text>
            <Text style={[styles.precio, styles.headerTexto]}>PRECIO UNITARIO</Text>
            <Text style={[styles.subtotal, styles.headerTexto]}>SUBTOTAL</Text>
          </View>

          {productos.length > 0 ? (
            productos.map((producto, index) => {
              const cantidad = Number(producto.cantidad || 0);
              const precio = Number(producto.precioUnitario || producto.precio || 0);
              const subtotal = cantidad * precio;

              return (
                <View style={styles.tablaFila} key={producto.idProducto || index}>
                  <Text style={[styles.producto, styles.productoNombre]}>
                    {producto.nombre || producto.producto || "Producto"}
                  </Text>
                  <Text style={styles.cantidad}>{cantidad}</Text>
                  <Text style={styles.precio}>{formatearDinero(precio)}</Text>
                  <Text style={styles.subtotal}>{formatearDinero(subtotal)}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.tablaFila}>
              <Text style={styles.producto}>Sin productos</Text>
              <Text style={styles.cantidad}>-</Text>
              <Text style={styles.precio}>-</Text>
              <Text style={styles.subtotal}>-</Text>
            </View>
          )}
        </View>

        <View style={styles.totalContainer}>
          <View style={styles.totalBox}>
            <View>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
              <Text style={styles.totalLabel}>IVA</Text>
              <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
            </View>
            <View>
              <Text style={styles.total}>{formatearDinero(subtotal)}</Text>
              <Text style={styles.total}>{formatearDinero(iva)}</Text>
              <Text style={styles.total}>{formatearDinero(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pagoConfirmado}>
          <Text style={styles.check}>✓</Text>
          <View>
            <Text style={styles.pagoTitulo}>Pago confirmado</Text>
            <Text style={styles.pagoTexto}>La compra fue registrada correctamente.</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerTexto}>Concre Innova · Comprobante digital</Text>
          <Text
            style={styles.footerTexto}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

function ComprobantePedido({ pedido }) {
  if (!pedido) {
    return null;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
      <PDFDownloadLink
        document={<DocumentoComprobante pedido={pedido} />}
        fileName={`Comprobante-Pedido-${pedido.idPedido}.pdf`}
        style={{ textDecoration: "none", display: "inline-flex" }}
      >
        {({ loading }) => (
          <button
            type="button"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: loading ? "#9AA7AD" : "#1F4E5F",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              minWidth: "220px",
            }}
          >
            <span>{loading ? "Generando PDF..." : "Descargar comprobante PDF"}</span>
          </button>
        )}
      </PDFDownloadLink>
    </div>
  );
}

export default ComprobantePedido;