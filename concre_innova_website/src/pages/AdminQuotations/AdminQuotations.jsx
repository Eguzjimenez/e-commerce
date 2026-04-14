import "./AdminQuotations.css";
import { useState } from "react";
import AdminLayout from "../../components/AdminLayout/AdminLayout";

function AdminQuotations() {
  const quotations = [
    {
      id: 1,
      cliente: "María López",
      fecha: "2026-04-10",
      estado: "Pendiente",
      resumen: "Consulta por maceteros grandes y plantas de interior.",
      detalle:
        "La clienta solicita una cotización para 4 maceteros grandes de cerámica y 6 plantas de interior para decoración de oficina.",
      productos: [
        "Macetero grande de cerámica",
        "Palma de interior",
        "Sansevieria"
      ]
    },
    {
      id: 2,
      cliente: "Carlos Herrera",
      fecha: "2026-04-12",
      estado: "Respondida",
      resumen: "Solicitud para fuente decorativa y accesorios.",
      detalle:
        "El cliente requiere una cotización para una fuente decorativa mediana y un set de piedras ornamentales para jardín.",
      productos: ["Fuente decorativa mediana", "Piedras ornamentales"]
    },
    {
      id: 3,
      cliente: "Ana Rodríguez",
      fecha: "2026-04-13",
      estado: "Cerrada",
      resumen: "Cotización para proyecto de terraza residencial.",
      detalle:
        "La clienta consultó por plantas, maceteros colgantes y accesorios para ambientar una terraza exterior.",
      productos: ["Macetero colgante", "Helecho", "Set decorativo exterior"]
    }
  ];

  const [selectedQuotation, setSelectedQuotation] = useState(quotations[0]);
  const [respuesta, setRespuesta] = useState("");

  return (
    <AdminLayout title="Atención de Cotizaciones">
      <div className="admin-quotations-page">
        <div className="admin-quotations-list">
          <div className="admin-quotations-list-header">
            <h2>Solicitudes recibidas</h2>
            <p>Revisa y responde las cotizaciones enviadas por los clientes.</p>
          </div>

          <div className="admin-quotation-items">
            {quotations.map((quotation) => (
              <button
                key={quotation.id}
                className={`admin-quotation-item ${
                  selectedQuotation.id === quotation.id ? "active" : ""
                }`}
                onClick={() => setSelectedQuotation(quotation)}
              >
                <div className="admin-quotation-item-top">
                  <h3>{quotation.cliente}</h3>
                  <span
                    className={`quotation-status ${
                      quotation.estado === "Pendiente"
                        ? "pendiente"
                        : quotation.estado === "Respondida"
                        ? "respondida"
                        : "cerrada"
                    }`}
                  >
                    {quotation.estado}
                  </span>
                </div>

                <p className="admin-quotation-date">{quotation.fecha}</p>
                <p className="admin-quotation-summary">{quotation.resumen}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-quotation-detail">
          <div className="admin-quotation-detail-header">
            <h2>Detalle de cotización</h2>
            <span
              className={`quotation-status ${
                selectedQuotation.estado === "Pendiente"
                  ? "pendiente"
                  : selectedQuotation.estado === "Respondida"
                  ? "respondida"
                  : "cerrada"
              }`}
            >
              {selectedQuotation.estado}
            </span>
          </div>

          <div className="admin-quotation-info">
            <p>
              <strong>Cliente:</strong> {selectedQuotation.cliente}
            </p>
            <p>
              <strong>Fecha:</strong> {selectedQuotation.fecha}
            </p>
            <p>
              <strong>Descripción:</strong> {selectedQuotation.detalle}
            </p>
          </div>

          <div className="admin-quotation-products">
            <h3>Productos solicitados</h3>
            <ul>
              {selectedQuotation.productos.map((producto, index) => (
                <li key={index}>{producto}</li>
              ))}
            </ul>
          </div>

          <div className="admin-quotation-response">
            <label htmlFor="respuestaCotizacion">Respuesta al cliente</label>
            <textarea
              id="respuestaCotizacion"
              placeholder="Escribe aquí la respuesta para esta cotización"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />
          </div>

          <div className="admin-quotation-actions">
            <button className="admin-primary-button">Enviar respuesta</button>
            <button className="admin-secondary-button">Cambiar estado</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminQuotations;